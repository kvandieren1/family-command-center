// API endpoint stub for GPT-4o task extraction
// This would typically be a backend API endpoint

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { transcript, profiles } = req.body

  // In a real implementation, this would call OpenAI GPT-4o API
  // For now, return a structured response based on simple parsing
  
  const lowerTranscript = transcript.toLowerCase()
  
  // Extract owner
  const owner = profiles.find(p => 
    p.type === 'owner' && 
    lowerTranscript.includes(p.name.toLowerCase())
  )

  // Extract dependent
  const dependent = profiles.find(p => 
    p.type === 'dependent' && 
    lowerTranscript.includes(p.name.toLowerCase())
  )

  // Extract date mentions
  const dateKeywords = {
    'today': 0,
    'tomorrow': 1,
    'friday': getDaysUntil('friday'),
    'saturday': getDaysUntil('saturday'),
    'sunday': getDaysUntil('sunday'),
    'monday': getDaysUntil('monday'),
    'tuesday': getDaysUntil('tuesday'),
    'wednesday': getDaysUntil('wednesday'),
    'thursday': getDaysUntil('thursday')
  }

  let dueDate = null
  for (const [keyword, days] of Object.entries(dateKeywords)) {
    if (lowerTranscript.includes(keyword)) {
      const date = new Date()
      date.setDate(date.getDate() + days)
      dueDate = date.toISOString().split('T')[0]
      break
    }
  }

  // Determine cognitive weight
  const heavyKeywords = ['find', 'research', 'plan', 'organize', 'coordinate', 'schedule']
  const cognitiveWeight = heavyKeywords.some(k => lowerTranscript.includes(k)) ? 'heavy' : 'medium'

  // Extract task title (first sentence or key phrase)
  const title = transcript.split(/[.!?]/)[0].trim() || transcript.substring(0, 50)

  return res.status(200).json({
    task: {
      title,
      description: transcript,
      due_date: dueDate,
      cognitive_weight: cognitiveWeight,
      cpe_phase: null
    },
    owner: owner?.name,
    dependent: dependent?.name
  })
}

function getDaysUntil(targetDay) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const today = new Date().getDay()
  const target = days.indexOf(targetDay.toLowerCase())
  
  // If target day is today, return 7 (next week) instead of 0
  // This prevents scheduling tasks for "today" when user means "next [day]"
  if (target === today) {
    return 7;
  }
  
  // Otherwise calculate days until target day (this week or next week)
  return target > today ? target - today : 7 - today + target
}
