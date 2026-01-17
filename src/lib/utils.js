// Utility functions

export function getDependentColor(dependentId, profiles) {
  const dependent = profiles?.find(p => p.id === dependentId && p.type === 'dependent')
  return dependent?.color_code || '#e0e0e0'
}

export function getOwnerInitials(ownerId, profiles) {
  const owner = profiles?.find(p => p.id === ownerId && p.type === 'owner')
  return owner?.initials || '?'
}

export function formatTaskDisplay(task, profiles) {
  const owner = profiles?.find(p => p.id === task.owner_id)
  const dependent = profiles?.find(p => p.id === task.dependent_id)
  
  return {
    ...task,
    ownerInitials: owner?.initials || '?',
    dependentName: dependent?.name,
    dependentColor: dependent?.color_code
  }
}

export function getCognitiveWeightColor(weight) {
  const colors = {
    heavy: '#ff0000',
    medium: '#ffaa00',
    low: '#00ff00'
  }
  return colors[weight] || colors.medium
}

export function calculateCompletionRate(tasks) {
  if (!tasks || tasks.length === 0) return 0
  const completed = tasks.filter(t => t.status === 'completed').length
  return Math.round((completed / tasks.length) * 100)
}

export function calculateStreak(tasks) {
  if (!tasks || tasks.length === 0) return 0
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)
    
    const hasCompletedTask = tasks.some(t => {
      if (!t.completed_at) return false
      const completedDate = new Date(t.completed_at)
      completedDate.setHours(0, 0, 0, 0)
      return completedDate.getTime() === checkDate.getTime()
    })
    
    if (hasCompletedTask) {
      streak++
    } else if (i === 0) {
      break
    } else {
      break
    }
  }
  
  return streak
}
