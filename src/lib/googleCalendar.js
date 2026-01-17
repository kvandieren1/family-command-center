// Google Calendar API Integration
const GOOGLE_CALENDAR_API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY

export async function syncGoogleCalendar(householdId, accessToken) {
  if (!accessToken || !GOOGLE_CALENDAR_API_KEY) {
    console.error('Google Calendar API not configured')
    return
  }

  try {
    // Fetch events from Google Calendar
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?key=${GOOGLE_CALENDAR_API_KEY}&timeMin=${new Date().toISOString()}&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )

    const data = await response.json()
    const events = data.items || []

    // Process and store events in Supabase
    const { supabase } = await import('./supabase')
    
    for (const event of events) {
      // Extract dependent name from event title/description
      const dependentMatch = extractDependentFromEvent(event)
      
      await supabase
        .from('calendar_events')
        .upsert({
          household_id: householdId,
          google_event_id: event.id,
          title: event.summary || 'Untitled Event',
          description: event.description,
          start_time: event.start.dateTime || event.start.date,
          end_time: event.end.dateTime || event.end.date,
          dependent_id: dependentMatch?.id,
          color_code: dependentMatch?.color_code
        }, {
          onConflict: 'google_event_id'
        })
    }

    return events
  } catch (error) {
    console.error('Error syncing Google Calendar:', error)
    throw error
  }
}

function extractDependentFromEvent(event) {
  // Simple extraction - look for dependent names in title/description
  const text = `${event.summary} ${event.description}`.toLowerCase()
  // This would be enhanced with actual profile lookup
  return null
}

export async function requestGoogleCalendarAccess() {
  // OAuth2 flow for Google Calendar
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const redirectUri = `${window.location.origin}/auth/google/callback`
  const scope = 'https://www.googleapis.com/auth/calendar.readonly'
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
  
  window.location.href = authUrl
}
