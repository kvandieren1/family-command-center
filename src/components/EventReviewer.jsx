import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COGNITIVE_WEIGHT, supabase } from '../lib/supabase';

// Mock events fallback - Always available for demo
const MOCK_EVENTS = [
  {
    id: 1,
    title: "Family Dinner",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    time: "6:00 PM - 8:00 PM",
    description: "Weekly family dinner gathering",
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    title: "Gym Session",
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    time: "6:00 AM - 7:00 AM",
    description: "Morning workout routine",
    startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    title: "Birthday Party",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    time: "2:00 PM - 5:00 PM",
    description: "Special birthday celebration planning",
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    title: "School Meeting",
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    time: "3:00 PM - 4:00 PM",
    description: "Parent-teacher conference",
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString()
  }
];

export default function EventReviewer({ onStarredCountChange, onComplete, householdId }) {
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [starredCount, setStarredCount] = useState(0);
  const [selectedWeights, setSelectedWeights] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [useMockEvents, setUseMockEvents] = useState(true); // Start with true, will check session and update

  // Check for valid Google session on mount and listen for auth changes
  useEffect(() => {
    const checkGoogleSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.provider_token) {
          // Valid Google session detected - default to calendar
          setUseMockEvents(false);
        } else {
          // No valid session - default to mock
          setUseMockEvents(true);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        // Default to mock on error
        setUseMockEvents(true);
      }
    };

    checkGoogleSession();

    // Listen for auth state changes (e.g., when user returns from OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.provider_token) {
        // User just signed in via Google OAuth - switch to calendar and fetch events
        setUseMockEvents(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (useMockEvents) {
      setEvents(MOCK_EVENTS);
      setIsLoading(false);
    } else {
      fetchGoogleCalendarEvents();
    }
  }, [householdId, useMockEvents]);

  // CRITICAL: Ensure events are never empty - always have mock events as fallback for demo
  useEffect(() => {
    if (events.length === 0 && !isLoading) {
      console.log('[EventReviewer] Events array is empty, automatically loading mock/demo events');
      setEvents(MOCK_EVENTS);
      setUseMockEvents(true);
    }
  }, [events.length, isLoading]);

  const fetchGoogleCalendarEvents = async () => {
    try {
      setIsLoading(true);
      
      // DEBUG: Log start of fetch
      console.log('[EventReviewer] Starting Google Calendar fetch...');
      
      // Get the user session to access provider_token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.log('[EventReviewer] No Google session found, using mock events', sessionError);
        setEvents(MOCK_EVENTS);
        setIsLoading(false);
        return;
      }

      // DEBUG: Log session info
      console.log('[EventReviewer] Session found:', {
        hasUser: !!session.user,
        userEmail: session.user?.email,
        hasProviderToken: !!session.provider_token,
        hasAccessToken: !!session.access_token
      });

      // Get provider token from session
      // Supabase stores OAuth provider tokens in the session
      const providerToken = session.provider_token || session.access_token;
      
      if (!providerToken) {
        console.log('[EventReviewer] No provider token found, falling back to mock events');
        setEvents(MOCK_EVENTS);
        setIsLoading(false);
        setUseMockEvents(true); // Automatically switch to mock if no token
        return;
      }

      // DEBUG: Log token (first 20 chars only for security)
      console.log('[EventReviewer] Using token:', providerToken.substring(0, 20) + '...');

      // Fetch events from Google Calendar API (last 15 events)
      const timeMin = new Date().toISOString();
      const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=15&singleEvents=true&orderBy=startTime`;
      
      console.log('[EventReviewer] Fetching from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${providerToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[EventReviewer] API Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[EventReviewer] Google Calendar API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Google Calendar API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const googleEvents = data.items || [];
      
      // DEBUG: Log events received
      console.log('[EventReviewer] Google Calendar API returned:', {
        totalEvents: googleEvents.length,
        events: googleEvents.map(e => ({ id: e.id, summary: e.summary, start: e.start }))
      });

      // Transform Google Calendar events to our format
      const transformedEvents = googleEvents.map((event, index) => {
        const start = event.start?.dateTime || event.start?.date;
        const end = event.end?.dateTime || event.end?.date;
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        return {
          id: `google-${event.id || index}`,
          googleEventId: event.id,
          title: event.summary || 'Untitled Event',
          description: event.description || '',
          date: startDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          time: event.start?.dateTime 
            ? `${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
            : 'All Day',
          startTime: start,
          endTime: end
        };
      });

      if (transformedEvents.length > 0) {
        console.log('[EventReviewer] Successfully transformed', transformedEvents.length, 'events');
        setEvents(transformedEvents);
      } else {
        // No events found - CRITICAL: Always fall back to mock events for demo
        console.log('[EventReviewer] No Google Calendar events found, automatically loading mock/demo events');
        setEvents(MOCK_EVENTS);
        setUseMockEvents(true); // Automatically switch to mock if no events
      }
    } catch (err) {
      console.error('[EventReviewer] Error fetching Google Calendar events:', err);
      // CRITICAL: Always fall back to mock events on error for demo
      console.log('[EventReviewer] Error occurred, automatically loading mock/demo events for demo');
      setEvents(MOCK_EVENTS);
      setUseMockEvents(true); // Automatically switch to mock on error
    } finally {
      setIsLoading(false);
    }
  };

  const currentEvent = events[currentIndex];

  const handleJustShowingUp = async () => {
    // Swipe Left - Ignore/discard event
    console.log('[EventReviewer] Swipe Left - Ignoring event:', currentEvent.title);
    
    // Mark as reviewed and move to next
    if (currentIndex < events.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All events reviewed
      if (onStarredCountChange) {
        onStarredCountChange(starredCount);
      }
      // Allow transition to dashboard after a brief delay
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1000);
    }
  };

  const handleNeedsPlanning = async (weight) => {
    const eventId = currentEvent.id;
    const HOUSEHOLD_ID = '0bac63fe-1b2b-4849-8157-02612b296928'; // Van Dieren Command household ID
    
    // Swipe Right - Save event to Supabase
    console.log('[EventReviewer] Swipe Right - Saving event to Supabase:', {
      eventId: currentEvent.id,
      title: currentEvent.title,
      weight: weight,
      googleEventId: currentEvent.googleEventId
    });
    
    try {
      // Save event to Supabase calendar_events table
      if (currentEvent.googleEventId || currentEvent.id) {
        const { data, error } = await supabase
          .from('calendar_events')
          .upsert({
            household_id: HOUSEHOLD_ID,
            google_event_id: currentEvent.googleEventId || currentEvent.id,
            title: currentEvent.title,
            description: currentEvent.description || '',
            start_time: currentEvent.startTime || new Date().toISOString(),
            end_time: currentEvent.endTime || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'google_event_id'
          });

        if (error) {
          console.error('[EventReviewer] Error saving event to Supabase:', error);
        } else {
          console.log('[EventReviewer] Event saved successfully:', data);
        }
      }
    } catch (err) {
      console.error('[EventReviewer] Failed to save event:', err);
    }
    
    // Update selected weight for this event
    setSelectedWeights({
      ...selectedWeights,
      [eventId]: weight
    });

    // Increment starred count if this is the first time selecting a weight for this event
    if (!selectedWeights[eventId]) {
      const newCount = starredCount + 1;
      setStarredCount(newCount);
      
      // Notify parent component
      if (onStarredCountChange) {
        onStarredCountChange(newCount);
      }
    }

    // Move to next event after a brief delay
    setTimeout(() => {
      if (currentIndex < events.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // All events reviewed
        if (onStarredCountChange) {
          onStarredCountChange(starredCount + 1);
        }
        // Allow transition to dashboard after a brief delay
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 1000);
      }
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 mb-4 text-lg">
            {!useMockEvents ? 'Fetching your family schedule...' : 'Loading calendar events...'}
          </div>
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">All Events Reviewed!</h2>
          <p className="text-slate-400 mb-6">You've reviewed all {events.length} events.</p>
          {onComplete && (
            <button
              onClick={onComplete}
              className="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-all"
            >
              Continue to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / events.length) * 100;
  const isStarred = selectedWeights[currentEvent.id] !== undefined;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Toggle: Mock vs Real Calendar */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <span className="text-sm text-slate-400">Event Source:</span>
          <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1">
            <button
              onClick={() => setUseMockEvents(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                useMockEvents
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Use Mock Events
            </button>
            <button
              onClick={() => setUseMockEvents(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !useMockEvents
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Use My Calendar
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">
              Reviewing Events ({currentIndex + 1} of {events.length})
            </span>
            <span className="text-sm text-slate-400">
              {starredCount} starred for planning
            </span>
          </div>
          <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-500 to-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Event Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentEvent.id}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95, rotate: -5 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 shadow-2xl"
          >
            {/* Event Details */}
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-white mb-2">
                {currentEvent.title}
              </h2>
              {currentEvent.description && (
                <p className="text-slate-400 text-sm mb-4">
                  {currentEvent.description}
                </p>
              )}
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">📅</span>
                  <span>{currentEvent.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">⏰</span>
                  <span>{currentEvent.time}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* Just Showing Up Button */}
              <button
                onClick={handleJustShowingUp}
                className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 font-medium hover:bg-slate-800/70 hover:border-slate-600/50 transition-all text-left"
              >
                Just Showing Up
              </button>

              {/* Needs Planning Section */}
              <div className="border-t border-slate-800/50 pt-4">
                <p className="text-sm text-slate-400 mb-3">Needs Planning</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleNeedsPlanning(COGNITIVE_WEIGHT.LOW)}
                    disabled={isStarred}
                    className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                      selectedWeights[currentEvent.id] === COGNITIVE_WEIGHT.LOW
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : isStarred
                        ? 'bg-slate-800/30 border-slate-700/30 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800/70 hover:border-slate-600/50'
                    }`}
                  >
                    Low
                  </button>
                  <button
                    onClick={() => handleNeedsPlanning(COGNITIVE_WEIGHT.MEDIUM)}
                    disabled={isStarred}
                    className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                      selectedWeights[currentEvent.id] === COGNITIVE_WEIGHT.MEDIUM
                        ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                        : isStarred
                        ? 'bg-slate-800/30 border-slate-700/30 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800/70 hover:border-slate-600/50'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => handleNeedsPlanning(COGNITIVE_WEIGHT.HEAVY)}
                    disabled={isStarred}
                    className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                      selectedWeights[currentEvent.id] === COGNITIVE_WEIGHT.HEAVY
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : isStarred
                        ? 'bg-slate-800/30 border-slate-700/30 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800/70 hover:border-slate-600/50'
                    }`}
                  >
                    Heavy
                  </button>
                </div>
                {isStarred && (
                  <p className="mt-2 text-xs text-slate-500 text-center">
                    ⭐ Starred as {selectedWeights[currentEvent.id]}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
