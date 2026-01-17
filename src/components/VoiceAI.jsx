import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function VoiceAI() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [recognition, setRecognition] = useState(null)
  const [householdId, setHouseholdId] = useState(null)
  const [profiles, setProfiles] = useState([])

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onresult = async (event) => {
        const transcriptText = event.results[0][0].transcript
        setTranscript(transcriptText)
        await processTranscript(transcriptText)
        setIsListening(false)
      }

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }

    // Load household and profiles
    loadHouseholdData()
  }, [])

  const loadHouseholdData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('household_id, household:households(id)')
      .eq('user_id', user.id)
      .single()

    if (profileData?.household_id) {
      setHouseholdId(profileData.household_id)

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .eq('household_id', profileData.household_id)

      setProfiles(profilesData || [])
    }
  }

  const processTranscript = async (text) => {
    if (!householdId) return

    // Try to call GPT-4o API endpoint (would be a backend API in production)
    try {
      // In production, this would call your backend API
      // For now, use simple extraction
      await simpleTaskExtraction(text)
      
      // Uncomment when backend API is ready:
      /*
      const response = await fetch('/api/extract-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          profiles: profiles.map(p => ({ name: p.name, type: p.type, initials: p.initials }))
        })
      })

      const extracted = await response.json()

      if (extracted.task) {
        const owner = profiles.find(p => 
          p.name.toLowerCase().includes(extracted.owner?.toLowerCase() || '') && 
          p.type === 'owner'
        )
        const dependent = profiles.find(p => 
          p.name.toLowerCase().includes(extracted.dependent?.toLowerCase() || '') && 
          p.type === 'dependent'
        )

        const { error } = await supabase
          .from('tasks')
          .insert({
            household_id: householdId,
            owner_id: owner?.id,
            dependent_id: dependent?.id,
            title: extracted.task.title,
            description: extracted.task.description,
            due_date: extracted.task.due_date,
            cognitive_weight: extracted.task.cognitive_weight || 'medium',
            cpe_phase: extracted.task.cpe_phase
          })

        if (error) throw error
      }
      */
    } catch (error) {
      console.error('Error processing transcript:', error)
      await simpleTaskExtraction(text)
    }
  }

  const simpleTaskExtraction = async (text) => {
    // Simple fallback parsing
    const lowerText = text.toLowerCase()
    const owner = profiles.find(p => 
      lowerText.includes(p.name.toLowerCase()) && p.type === 'owner'
    )
    const dependent = profiles.find(p => 
      lowerText.includes(p.name.toLowerCase()) && p.type === 'dependent'
    )

    // Extract date mentions
    const dateMatch = text.match(/(friday|saturday|sunday|monday|tuesday|wednesday|thursday|today|tomorrow)/i)
    let dueDate = null
    if (dateMatch) {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const targetDay = days.indexOf(dateMatch[0].toLowerCase())
      const today = new Date().getDay()
      const daysUntil = targetDay >= today ? targetDay - today : 7 - today + targetDay
      dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + daysUntil)
    }

    // Determine cognitive weight
    const heavyKeywords = ['find', 'research', 'plan', 'organize', 'coordinate']
    const cognitiveWeight = heavyKeywords.some(k => lowerText.includes(k)) ? 'heavy' : 'medium'

    if (owner && text.length > 10) {
      await supabase
        .from('tasks')
        .insert({
          household_id: householdId,
          owner_id: owner.id,
          dependent_id: dependent?.id,
          title: text.substring(0, 100),
          due_date: dueDate ? dueDate.toISOString().split('T')[0] : null,
          cognitive_weight: cognitiveWeight
        })
    }
  }

  const toggleListening = () => {
    if (recognition) {
      if (isListening) {
        recognition.stop()
      } else {
        setTranscript('')
        recognition.start()
        setIsListening(true)
      }
    }
  }

  if (!recognition) {
    return null // Browser doesn't support speech recognition
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleListening}
        className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${
          isListening
            ? 'bg-terminal-error border-terminal-error animate-pulse'
            : 'bg-terminal-surface border-terminal-accent hover:bg-terminal-bg'
        }`}
        title="Voice Input"
      >
        <span className="text-2xl">🎤</span>
      </button>
      {transcript && (
        <div className="absolute bottom-20 right-0 w-64 p-3 bg-terminal-surface border border-terminal-border text-xs">
          <div className="text-terminal-accent mb-1">TRANSCRIPT:</div>
          <div className="text-terminal-text">{transcript}</div>
        </div>
      )}
    </div>
  )
}
