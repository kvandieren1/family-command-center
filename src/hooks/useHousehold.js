import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useHousehold() {
  const [household, setHousehold] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHousehold()
  }, [])

  const loadHousehold = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, household:households(*)')
        .eq('user_id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setHousehold(profileData.household)
      }
    } catch (error) {
      console.error('Error loading household:', error)
    } finally {
      setLoading(false)
    }
  }

  return { household, profile, loading, refresh: loadHousehold }
}
