import { supabase } from './supabase'

export async function createMeal(householdId, mealData) {
  const { data, error } = await supabase
    .from('meals')
    .insert({
      household_id: householdId,
      ...mealData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMealsForWeek(householdId, startDate) {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 7)

  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('household_id', householdId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date')

  if (error) throw error
  return data || []
}

export async function generateGroceryList(householdId, startDate) {
  const meals = await getMealsForWeek(householdId, startDate)
  const mealsNeedingGroceries = meals.filter(m => m.grocery_needed)
  
  // In a real implementation, this would parse meal names/descriptions
  // and extract ingredients, then aggregate into a shopping list
  return mealsNeedingGroceries.map(m => ({
    meal: m.name,
    date: m.date,
    meal_type: m.meal_type
  }))
}

export async function markGroceryNeeded(mealId, needed = true) {
  const { error } = await supabase
    .from('meals')
    .update({ grocery_needed: needed })
    .eq('id', mealId)

  if (error) throw error
}
