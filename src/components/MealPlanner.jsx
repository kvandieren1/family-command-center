import { useState, useEffect } from 'react'
import { format, addDays, startOfWeek } from 'date-fns'
import { supabase } from '../lib/supabase'
import { createMeal, getMealsForWeek, generateGroceryList } from '../lib/mealPlanner'

export default function MealPlanner({ householdId }) {
  const [meals, setMeals] = useState([])
  const [groceryList, setGroceryList] = useState([])
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }))
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    meal_type: 'dinner',
    name: '',
    notes: '',
    grocery_needed: false
  })

  useEffect(() => {
    if (householdId) {
      loadMeals()
      loadGroceryList()
    }
  }, [householdId, weekStart])

  const loadMeals = async () => {
    const data = await getMealsForWeek(householdId, weekStart)
    setMeals(data)
  }

  const loadGroceryList = async () => {
    const list = await generateGroceryList(householdId, weekStart)
    setGroceryList(list)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createMeal(householdId, formData)
      setShowForm(false)
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        meal_type: 'dinner',
        name: '',
        notes: '',
        grocery_needed: false
      })
      loadMeals()
      loadGroceryList()
    } catch (error) {
      console.error('Error creating meal:', error)
    }
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="bg-terminal-surface border border-terminal-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-terminal-accent">MEAL PIPELINE</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="px-2 py-1 text-xs border border-terminal-border active:bg-terminal-bg"
          >
            ← PREV
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
            className="px-2 py-1 text-xs border border-terminal-border active:bg-terminal-bg"
          >
            THIS WEEK
          </button>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="px-2 py-1 text-xs border border-terminal-border active:bg-terminal-bg"
          >
            NEXT →
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-2 py-1 text-xs border border-terminal-accent bg-terminal-accent text-terminal-bg active:opacity-80"
          >
            + ADD
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 border border-terminal-border bg-terminal-bg space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="px-2 py-1 bg-terminal-surface border border-terminal-border text-terminal-text text-xs"
              required
            />
            <select
              value={formData.meal_type}
              onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
              className="px-2 py-1 bg-terminal-surface border border-terminal-border text-terminal-text text-xs"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Meal Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-2 py-1 bg-terminal-surface border border-terminal-border text-terminal-text text-xs"
            required
          />
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-2 py-1 bg-terminal-surface border border-terminal-border text-terminal-text text-xs"
            rows="2"
          />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={formData.grocery_needed}
              onChange={(e) => setFormData({ ...formData, grocery_needed: e.target.checked })}
              className="w-4 h-4"
            />
            Grocery needed
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-1 bg-terminal-accent text-terminal-bg text-xs font-bold active:opacity-80"
            >
              CREATE
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1 border border-terminal-border text-xs active:bg-terminal-bg"
            >
              CANCEL
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-7 gap-1 mb-4">
        {days.map((day, idx) => {
          const dayMeals = meals.filter(m => 
            format(new Date(m.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          )
          return (
            <div key={idx} className="border border-terminal-border p-2 bg-terminal-bg">
              <div className="text-xs font-bold mb-2">{format(day, 'EEE')}</div>
              {dayMeals.map(meal => (
                <div key={meal.id} className="text-xs mb-1">
                  <div className="opacity-70">{meal.meal_type}</div>
                  <div>{meal.name}</div>
                  {meal.grocery_needed && (
                    <div className="text-terminal-warning">🛒</div>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {groceryList.length > 0 && (
        <div className="border-t border-terminal-border pt-4">
          <h3 className="text-sm font-bold mb-2">GROCERY LIST</h3>
          <div className="space-y-1 text-xs">
            {groceryList.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span>{item.meal}</span>
                <span className="opacity-70">{format(new Date(item.date), 'M/d')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

