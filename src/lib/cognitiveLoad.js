/**
 * Recursive Cognitive Load Calculator
 * Supports 3-tier hierarchy: Master Event -> Action Item -> Sub-task
 * Formula: total_load = own_score + sum(children_scores)
 */

import { supabase } from './supabase';

/**
 * Recursively calculate burden score for an item and its children
 * @param {string} itemId - ID of the action item
 * @param {Array} allItems - All action items from database
 * @returns {number} - Total burden score (own + children)
 */
export function calculateRecursiveBurden(itemId, allItems) {
  const item = allItems.find(i => i.id === itemId);
  if (!item) return 0;

  // Get own burden score (default to 0 if not set)
  const ownScore = item.burden_score || 0;

  // Find all children (items with this item as parent)
  const children = allItems.filter(i => i.parent_id === itemId);

  // Recursively sum children's burden scores
  const childrenScore = children.reduce((sum, child) => {
    return sum + calculateRecursiveBurden(child.id, allItems);
  }, 0);

  // Total = own score + sum of all children scores
  return ownScore + childrenScore;
}

/**
 * Calculate mental load for a specific pilot (Pilot or Co-Pilot)
 * @param {string} householdId - Household ID
 * @param {string} assignedTo - 'Pilot' or 'Co-Pilot'
 * @returns {Promise<{total: number, breakdown: object}>}
 */
export async function calculatePilotLoad(householdId, assignedTo) {
  try {
    // Fetch all active action_items for this household
    const { data: actionItems, error } = await supabase
      .from('action_items')
      .select('id, parent_id, burden_score, assigned_to, status')
      .eq('household_id', householdId)
      .in('status', ['pending', 'in_progress']);

    if (error) {
      console.error('Error fetching action_items for pilot load:', error);
      return { total: 0, breakdown: {} };
    }

    // Filter items assigned to this pilot (including root items and children)
    const pilotItems = (actionItems || []).filter(item => item.assigned_to === assignedTo);

    // Calculate recursive burden for each root item (items without parent_id)
    const rootItems = pilotItems.filter(item => !item.parent_id);
    
    let totalBurden = 0;
    const breakdown = {};

    rootItems.forEach(rootItem => {
      const recursiveScore = calculateRecursiveBurden(rootItem.id, pilotItems);
      totalBurden += recursiveScore;
      breakdown[rootItem.id] = {
        own: rootItem.burden_score || 0,
        recursive: recursiveScore
      };
    });

    // Also check calendar_events for master events assigned to this pilot
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('burden_score, assigned_to')
      .eq('household_id', householdId)
      .eq('assigned_to', assignedTo);

    if (!eventsError && events) {
      const eventsBurden = events.reduce((sum, event) => {
        return sum + (event.burden_score || 0);
      }, 0);
      totalBurden += eventsBurden;
    }

    return {
      total: totalBurden,
      breakdown,
      itemCount: pilotItems.length
    };
  } catch (err) {
    console.error('Error calculating pilot load:', err);
    return { total: 0, breakdown: {} };
  }
}

/**
 * Calculate total mental load for entire household (both pilots)
 * @param {string} householdId - Household ID
 * @returns {Promise<{pilot: number, coPilot: number, total: number}>}
 */
export async function calculateTotalMentalLoad(householdId) {
  const [pilotLoad, coPilotLoad] = await Promise.all([
    calculatePilotLoad(householdId, 'Pilot'),
    calculatePilotLoad(householdId, 'Co-Pilot')
  ]);

  return {
    pilot: pilotLoad.total,
    coPilot: coPilotLoad.total,
    total: pilotLoad.total + coPilotLoad.total,
    pilotBreakdown: pilotLoad.breakdown,
    coPilotBreakdown: coPilotLoad.breakdown
  };
}
