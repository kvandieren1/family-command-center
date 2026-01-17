import { createClient } from '@supabase/supabase-js';

// Use environment variables if available (for Vercel deployment), otherwise fall back to hardcoded values
// This ensures the app works both locally and in production with proper environment configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nwpiwznwbzztaqejmymy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53cGl3em53Ynp6dGFxZWpteW15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MDkwMTUsImV4cCI6MjA4NDA4NTAxNX0.PFDPy-EAzoqEGGwfBLhzs3u5Jo5O9MqO5uCGQX6u06c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log the Supabase connection (helps verify correct URL in production)
console.log('Supabase Bridge: Connected at', supabaseUrl);

export const PROFILE_TYPES = { OWNER: 'owner', STAFF: 'staff', DEPENDENT: 'dependent' };
export const COGNITIVE_WEIGHT = { HEAVY: 'heavy', MEDIUM: 'medium', LOW: 'low' };
export const TASK_STATUS = { PENDING: 'pending', IN_PROGRESS: 'in_progress', COMPLETED: 'completed', OVERDUE: 'overdue' };

/**
 * Sign in with Google OAuth and request Calendar readonly scope
 * After successful login, searches for existing household by user's email
 * 
 * @returns {Promise<{success: boolean, user?: object, household?: object, error?: string}>}
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar.events.readonly',
        redirectTo: `${window.location.origin}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      console.error('Error signing in with Google:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // The OAuth flow will redirect, so we return the URL
    return {
      success: true,
      redirectUrl: data.url
    };
  } catch (err) {
    console.error('Unexpected error in signInWithGoogle:', err);
    return {
      success: false,
      error: `Unexpected error: ${err.message}`
    };
  }
}

/**
 * After OAuth callback, get the user session and search for household by email
 * Supabase automatically handles the OAuth callback and creates a session
 * 
 * @returns {Promise<{success: boolean, user?: object, household?: object, providerToken?: string, error?: string}>}
 */
export async function handleGoogleCallback() {
  try {
    // Supabase automatically handles the OAuth callback
    // Get the current session (should be set after OAuth redirect)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
    }

    if (!session || !session.user) {
      return {
        success: false,
        error: 'No active session found. Please try signing in again.'
      };
    }

    const user = session.user;
    const email = user.email;

    // Access provider token from session
    // Note: Supabase stores provider tokens in the session's provider_token field
    // This is available after OAuth sign-in
    const providerToken = session.provider_token || session.access_token;

    // Search for existing household by user's email
    // First, check if user is linked to a profile with a household
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        household:households(*)
      `)
      .eq('user_id', user.id)
      .limit(1);

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }

    // If profile exists with household, return it
    if (profiles && profiles.length > 0 && profiles[0].household) {
      return {
        success: true,
        user: user,
        household: profiles[0].household,
        providerToken: providerToken
      };
    }

    // If no profile found, search by email in profiles table
    if (email) {
      const { data: emailProfiles, error: emailError } = await supabase
        .from('profiles')
        .select(`
          *,
          household:households(*)
        `)
        .ilike('email', `%${email}%`)
        .eq('type', 'owner')
        .limit(1);

      if (emailError && emailError.code !== 'PGRST116') {
        console.error('Error searching by email:', emailError);
      }

      if (emailProfiles && emailProfiles.length > 0 && emailProfiles[0].household) {
        return {
          success: true,
          user: user,
          household: emailProfiles[0].household,
          providerToken: providerToken
        };
      }
    }

    // No household found - user will need to complete onboarding
    return {
      success: true,
      user: user,
      household: null,
      providerToken: providerToken
    };

  } catch (err) {
    console.error('Unexpected error in handleGoogleCallback:', err);
    return {
      success: false,
      error: `Unexpected error: ${err.message}`
    };
  }
}

/**
 * Toggles event planning status by starring an event and creating a linked task
 * When Amy "stars" an event, this function:
 * 1. Updates households_events table to set is_starred = true
 * 2. Inserts a corresponding row into tasks table with parent_event_id link
 * 3. Sets the cognitive_weight using COGNITIVE_WEIGHT constants
 * 4. Initializes sub_tasks JSONB column as []
 * 
 * @param {string} eventId - The UUID of the event being starred
 * @param {string} initialWeight - The initial cognitive weight (HEAVY, MEDIUM, or LOW)
 * @param {string} householdId - The UUID of the household
 * @param {string} ownerId - The UUID of the profile (owner) starring the event
 * @param {string|null} dependentId - Optional UUID of the dependent linked to this event
 * @returns {Promise<{success: boolean, taskId?: string, error?: string}>}
 */
export async function toggleEventPlanning(eventId, initialWeight, householdId, ownerId, dependentId = null) {
  try {
    // Validate cognitive weight
    const validWeights = Object.values(COGNITIVE_WEIGHT);
    if (!validWeights.includes(initialWeight)) {
      return {
        success: false,
        error: `Invalid cognitive weight. Must be one of: ${validWeights.join(', ')}`
      };
    }

    // Step 1: Update the households_events table to set is_starred = true
    const { error: eventUpdateError } = await supabase
      .from('households_events')
      .update({ 
        is_starred: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .eq('household_id', householdId);

    if (eventUpdateError) {
      console.error('Error updating event:', eventUpdateError);
      return {
        success: false,
        error: `Failed to update event: ${eventUpdateError.message}`
      };
    }

    // Step 2: Get the event details to use for the task
    const { data: eventData, error: eventFetchError } = await supabase
      .from('households_events')
      .select('title, start_time, end_time')
      .eq('id', eventId)
      .single();

    if (eventFetchError) {
      console.error('Error fetching event details:', eventFetchError);
      return {
        success: false,
        error: `Failed to fetch event details: ${eventFetchError.message}`
      };
    }

    // Step 3: Create the primary task linked to the event
    const taskTitle = eventData.title || 'Event Planning Task';
    const dueDate = eventData.start_time ? new Date(eventData.start_time).toISOString().split('T')[0] : null;

    const { data: taskData, error: taskCreateError } = await supabase
      .from('tasks')
      .insert([
        {
          household_id: householdId,
          owner_id: ownerId,
          dependent_id: dependentId,
          title: taskTitle,
          description: `Planning task for: ${taskTitle}`,
          due_date: dueDate,
          cognitive_weight: initialWeight,
          status: TASK_STATUS.PENDING,
          parent_event_id: eventId, // Link to the households_events table
          sub_tasks: [] // Initialize empty JSONB array
        }
      ])
      .select('id')
      .single();

    if (taskCreateError) {
      console.error('Error creating task:', taskCreateError);
      return {
        success: false,
        error: `Failed to create task: ${taskCreateError.message}`
      };
    }

    console.log('Event planning toggled successfully:', {
      eventId,
      taskId: taskData.id,
      cognitiveWeight: initialWeight
    });

    return {
      success: true,
      taskId: taskData.id
    };

  } catch (err) {
    console.error('Unexpected error in toggleEventPlanning:', err);
    return {
      success: false,
      error: `Unexpected error: ${err.message}`
    };
  }
}

/**
 * Gets all starred events with their linked task data for Dashboard display
 * Joins households_events and tasks tables to show planning progress
 * 
 * @param {string} householdId - The UUID of the household
 * @returns {Promise<{success: boolean, events?: Array, error?: string}>}
 */
export async function getStarredEvents(householdId) {
  try {
    // Fetch starred events
    const { data: events, error: eventsError } = await supabase
      .from('households_events')
      .select('*')
      .eq('household_id', householdId)
      .eq('is_starred', true)
      .order('start_time', { ascending: true });

    if (eventsError) {
      console.error('Error fetching starred events:', eventsError);
      return {
        success: false,
        error: `Failed to fetch starred events: ${eventsError.message}`
      };
    }

    if (!events || events.length === 0) {
      return {
        success: true,
        events: []
      };
    }

    // Fetch all tasks linked to these events
    const eventIds = events.map(e => e.id);
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('household_id', householdId)
      .in('parent_event_id', eventIds);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return {
        success: false,
        error: `Failed to fetch tasks: ${tasksError.message}`
      };
    }

    // Join events with their tasks
    const starredEventsWithTasks = events.map(event => {
      const linkedTask = tasks?.find(task => task.parent_event_id === event.id) || null;
      
      return {
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          start_time: event.start_time,
          end_time: event.end_time,
          is_starred: event.is_starred,
          dependent_id: event.dependent_id,
          color_code: event.color_code,
          created_at: event.created_at,
          updated_at: event.updated_at
        },
        task: linkedTask,
        planningProgress: linkedTask ? {
          hasTask: true,
          taskId: linkedTask.id,
          cognitiveWeight: linkedTask.cognitive_weight,
          status: linkedTask.status,
          subTasksCount: linkedTask.sub_tasks ? linkedTask.sub_tasks.length : 0,
          subTasks: linkedTask.sub_tasks || []
        } : {
          hasTask: false,
          subTasksCount: 0,
          subTasks: []
        }
      };
    });

    return {
      success: true,
      events: starredEventsWithTasks
    };

  } catch (err) {
    console.error('Unexpected error in getStarredEvents:', err);
    return {
      success: false,
      error: `Unexpected error: ${err.message}`
    };
  }
}