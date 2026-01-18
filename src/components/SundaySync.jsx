import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SundaySync() {
  const [step, setStep] = useState(1)
  const [householdId, setHouseholdId] = useState(null)
  const [mode, setMode] = useState('manual') // 'manual' or 'voice'

  useEffect(() => {
    loadHouseholdData()
  }, [])

  const loadHouseholdData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('household_id')
      .eq('user_id', user.id)
      .single()

    if (profileData) {
      setHouseholdId(profileData.household_id)
    }
  }

  const steps = [
    { id: 1, title: 'LOGISTICS REVIEW', component: <LogisticsStep householdId={householdId} /> },
    { id: 2, title: 'LOAD BALANCE', component: <LoadBalanceStep householdId={householdId} /> },
    { id: 3, title: 'MEAL PLAN', component: <MealPlanStep householdId={householdId} /> },
    { id: 4, title: 'STRATEGIC PULSE', component: <StrategicPulseStep householdId={householdId} /> },
    { id: 5, title: 'RELATIONSHIP CHECK', component: <RelationshipCheckStep householdId={householdId} /> },
  ]

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-terminal-accent mb-6">SUNDAY SYNC</h1>
        
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setMode('manual')}
            className={`px-4 py-2 border ${
              mode === 'manual' 
                ? 'bg-terminal-accent text-terminal-bg border-terminal-accent' 
                : 'border-terminal-border active:bg-terminal-surface'
            }`}
          >
            MANUAL MODE
          </button>
          <button
            onClick={() => setMode('voice')}
            className={`px-4 py-2 border ${
              mode === 'voice' 
                ? 'bg-terminal-accent text-terminal-bg border-terminal-accent' 
                : 'border-terminal-border active:bg-terminal-surface'
            }`}
          >
            VERBAL AI MODE
          </button>
        </div>

        {mode === 'manual' ? (
          <>
            {/* Progress Steps */}
            <div className="flex gap-2 mb-8">
              {steps.map(s => (
                <div
                  key={s.id}
                  className={`flex-1 p-2 border text-center text-xs ${
                    step === s.id
                      ? 'border-terminal-accent bg-terminal-bg'
                      : step > s.id
                      ? 'border-terminal-accent opacity-50'
                      : 'border-terminal-border opacity-30'
                  }`}
                >
                  {s.id}. {s.title}
                </div>
              ))}
            </div>

            {/* Current Step Content */}
            <div className="bg-terminal-surface border border-terminal-border p-6 mb-4">
              {steps.find(s => s.id === step)?.component}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="px-4 py-2 border border-terminal-border active:bg-terminal-surface disabled:opacity-30"
              >
                ← PREV
              </button>
              <button
                onClick={() => setStep(Math.min(5, step + 1))}
                disabled={step === 5}
                className="px-4 py-2 border border-terminal-accent bg-terminal-accent text-terminal-bg active:opacity-80 disabled:opacity-30"
              >
                {step === 5 ? 'COMPLETE' : 'NEXT →'}
              </button>
            </div>
          </>
        ) : (
          <VoiceMode householdId={householdId} />
        )}
      </div>
    </div>
  )
}

function LogisticsStep({ householdId }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-4">LOGISTICS REVIEW</h2>
      <p className="text-sm opacity-70 mb-4">Review upcoming events, tasks, and commitments for the week.</p>
      {/* Integration with LogisticsTicker component would go here */}
    </div>
  )
}

function LoadBalanceStep({ householdId }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-4">LOAD BALANCE</h2>
      <p className="text-sm opacity-70 mb-4">Review and balance cognitive load in The Cockpit.</p>
      {/* Cognitive load visualization would go here */}
    </div>
  )
}

function MealPlanStep({ householdId }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-4">MEAL PLAN</h2>
      <p className="text-sm opacity-70 mb-4">Plan meals for the upcoming week and generate grocery list.</p>
      {/* Meal planning interface would go here */}
    </div>
  )
}

function StrategicPulseStep({ householdId }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-4">STRATEGIC PULSE</h2>
      <p className="text-sm opacity-70 mb-4">Review long-term goals and strategic initiatives.</p>
      {/* Strategic goals interface would go here */}
    </div>
  )
}

function RelationshipCheckStep({ householdId }) {
  const [score, setScore] = useState(50)
  const [notes, setNotes] = useState('')

  const saveScore = async () => {
    if (!householdId) return

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week (Sunday)

    await supabase
      .from('relationship_scores')
      .insert({
        household_id: householdId,
        week_start: weekStart.toISOString().split('T')[0],
        score,
        notes
      })
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">RELATIONSHIP CHECK</h2>
      <p className="text-sm opacity-70 mb-4">Rate the relationship health for this week (0-100).</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-2">SCORE: {score}</label>
          <input
            type="range"
            min="0"
            max="100"
            value={score}
            onChange={(e) => setScore(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">NOTES</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-32 p-2 bg-terminal-bg border border-terminal-border text-terminal-text"
            placeholder="Add notes about relationship health..."
          />
        </div>
        <button
          onClick={saveScore}
          className="px-4 py-2 bg-terminal-accent text-terminal-bg font-bold active:opacity-80"
        >
          SAVE SCORE
        </button>
      </div>
    </div>
  )
}

function VoiceMode({ householdId }) {
  return (
    <div className="bg-terminal-surface border border-terminal-border p-6">
      <h2 className="text-lg font-bold mb-4">VERBAL AI MODE</h2>
      <p className="text-sm opacity-70 mb-4">
        Start a conversation. The AI will listen and automatically extract tasks, assign pilots, 
        set cognitive weight, and define CPE phases.
      </p>
      <p className="text-xs opacity-50">
        Voice mode integration with GPT-4o would be implemented here.
      </p>
    </div>
  )
}

