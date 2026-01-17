import { useState } from 'react'
import { syncGoogleCalendar, requestGoogleCalendarAccess } from '../lib/googleCalendar'
import { supabase } from '../lib/supabase'

export default function GoogleCalendarSync({ householdId }) {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)

  const handleSync = async () => {
    setSyncing(true)
    try {
      // In a real implementation, you'd get the access token from storage/OAuth
      const accessToken = localStorage.getItem('google_calendar_access_token')
      
      if (!accessToken) {
        await requestGoogleCalendarAccess()
        return
      }

      await syncGoogleCalendar(householdId, accessToken)
      setLastSync(new Date())
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="p-4 border border-terminal-border bg-terminal-surface">
      <h3 className="text-sm font-bold mb-2">GOOGLE CALENDAR SYNC</h3>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="px-3 py-1 text-xs border border-terminal-accent bg-terminal-accent text-terminal-bg hover:opacity-80 disabled:opacity-50"
      >
        {syncing ? 'SYNCING...' : 'SYNC NOW'}
      </button>
      {lastSync && (
        <div className="text-xs mt-2 opacity-70">
          Last sync: {lastSync.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
