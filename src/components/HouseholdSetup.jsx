import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function HouseholdSetup() {
  const [step, setStep] = useState(1)
  const [householdName, setHouseholdName] = useState('')
  const [owners, setOwners] = useState([{ name: '', initials: '' }])
  const [dependents, setDependents] = useState([{ name: '', color_code: '#4a9eff' }])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleCreateHousehold = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({ name: householdName })
        .select()
        .single()

      if (householdError) throw householdError

      // Create owner profiles
      for (const owner of owners) {
        if (owner.name && owner.initials) {
          await supabase
            .from('profiles')
            .insert({
              household_id: household.id,
              user_id: owner.name === owners[0].name ? user.id : null, // First owner gets auth
              name: owner.name,
              initials: owner.initials.toUpperCase(),
              type: 'owner'
            })
        }
      }

      // Create dependent profiles
      for (const dependent of dependents) {
        if (dependent.name) {
          await supabase
            .from('profiles')
            .insert({
              household_id: household.id,
              name: dependent.name,
              type: 'dependent',
              color_code: dependent.color_code
            })
        }
      }

      navigate('/')
      window.location.reload()
    } catch (error) {
      console.error('Error creating household:', error)
      alert('Error creating household. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addOwner = () => {
    setOwners([...owners, { name: '', initials: '' }])
  }

  const addDependent = () => {
    setDependents([...dependents, { name: '', color_code: '#4a9eff' }])
  }

  const updateOwner = (index, field, value) => {
    const updated = [...owners]
    updated[index][field] = value
    setOwners(updated)
  }

  const updateDependent = (index, field, value) => {
    const updated = [...dependents]
    updated[index][field] = value
    setDependents(updated)
  }

  return (
    <div className="min-h-screen p-8 flex items-center justify-center bg-terminal-bg">
      <div className="w-full max-w-2xl border border-terminal-border bg-terminal-surface p-8">
        <h1 className="text-2xl font-bold text-terminal-accent mb-6">SETUP HOUSEHOLD</h1>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">HOUSEHOLD NAME</label>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="e.g., Van Dieren Family"
                className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border text-terminal-text"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!householdName}
              className="w-full py-2 bg-terminal-accent text-terminal-bg font-bold active:opacity-80 disabled:opacity-50"
            >
              NEXT →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4">THE COCKPIT</h2>
            {owners.map((owner, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={owner.name}
                  onChange={(e) => updateOwner(idx, 'name', e.target.value)}
                  className="px-3 py-2 bg-terminal-bg border border-terminal-border text-terminal-text"
                />
                <input
                  type="text"
                  placeholder="Initials"
                  value={owner.initials}
                  onChange={(e) => updateOwner(idx, 'initials', e.target.value.toUpperCase().substring(0, 2))}
                  maxLength={2}
                  className="px-3 py-2 bg-terminal-bg border border-terminal-border text-terminal-text"
                />
                {idx === owners.length - 1 && (
                  <button
                    onClick={addOwner}
                    className="px-3 py-2 border border-terminal-border active:bg-terminal-bg text-xs"
                  >
                    + ADD
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setStep(3)}
              disabled={owners.some(o => !o.name || !o.initials)}
              className="w-full py-2 bg-terminal-accent text-terminal-bg font-bold active:opacity-80 disabled:opacity-50"
            >
              NEXT →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4">DEPENDENTS</h2>
            {dependents.map((dependent, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={dependent.name}
                  onChange={(e) => updateDependent(idx, 'name', e.target.value)}
                  className="px-3 py-2 bg-terminal-bg border border-terminal-border text-terminal-text"
                />
                <input
                  type="color"
                  value={dependent.color_code}
                  onChange={(e) => updateDependent(idx, 'color_code', e.target.value)}
                  className="h-10 border border-terminal-border"
                />
                {idx === dependents.length - 1 && (
                  <button
                    onClick={addDependent}
                    className="px-3 py-2 border border-terminal-border active:bg-terminal-bg text-xs"
                  >
                    + ADD
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleCreateHousehold}
              disabled={loading || dependents.some(d => !d.name)}
              className="w-full py-2 bg-terminal-accent text-terminal-bg font-bold active:opacity-80 disabled:opacity-50"
            >
              {loading ? 'CREATING...' : 'COMPLETE SETUP'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

