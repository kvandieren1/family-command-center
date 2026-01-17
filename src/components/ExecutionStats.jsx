import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ExecutionStats({ householdId }) {
  const [streak, setStreak] = useState(0)
  const [completionRate, setCompletionRate] = useState(0)
  const [totalTasks, setTotalTasks] = useState(0)
  const [completedTasks, setCompletedTasks] = useState(0)

  useEffect(() => {
    if (householdId) {
      loadStats()
    }
  }, [householdId])

  const loadStats = async () => {
    // Calculate streak (consecutive days with completed tasks)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('completed_at, due_date, status')
      .eq('household_id', householdId)
      .order('completed_at', { ascending: false })

    // Calculate completion rate
    const allTasks = tasks || []
    const completed = allTasks.filter(t => t.status === 'completed').length
    const total = allTasks.length
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0

    setTotalTasks(total)
    setCompletedTasks(completed)
    setCompletionRate(rate)

    // Calculate streak
    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      
      const hasCompletedTask = allTasks.some(t => {
        if (!t.completed_at) return false
        const completedDate = new Date(t.completed_at)
        completedDate.setHours(0, 0, 0, 0)
        return completedDate.getTime() === checkDate.getTime()
      })

      if (hasCompletedTask) {
        currentStreak++
      } else if (i === 0) {
        // Today has no completed tasks, streak is 0
        break
      } else {
        // Found a day without completed tasks, streak ends
        break
      }
    }

    setStreak(currentStreak)
  }

  return (
    <div className="bg-terminal-surface border border-terminal-border p-4">
      <h2 className="text-lg font-bold text-terminal-accent mb-4">EXECUTION VELOCITY</h2>
      <div className="space-y-4">
        <div>
          <div className="text-3xl font-bold text-terminal-accent">{streak}</div>
          <div className="text-xs text-terminal-text opacity-70">DAY STREAK</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-terminal-accent">{completionRate}%</div>
          <div className="text-xs text-terminal-text opacity-70">ON-TIME COMPLETION</div>
        </div>
        <div className="pt-4 border-t border-terminal-border">
          <div className="text-sm text-terminal-text opacity-70">
            {completedTasks} / {totalTasks} TASKS COMPLETED
          </div>
        </div>
      </div>
    </div>
  )
}
