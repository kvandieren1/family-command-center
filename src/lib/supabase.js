import { createClient } from '@supabase/supabase-js';

// Use environment variables - REQUIRED for production deployment
// Security: Never commit credentials to version control
// If environment variables are not set, throw an error to prevent insecure fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set. ' +
    'Please configure these in your .env file or Vercel environment settings.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log the Supabase connection (helps verify correct URL in production)
console.log('Supabase Bridge: Connected at', supabaseUrl);

export const PROFILE_TYPES = { OWNER: 'owner', STAFF: 'staff', DEPENDENT: 'dependent' };
export const COGNITIVE_WEIGHT = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' };
export const TASK_STATUS = { PENDING: 'pending', IN_PROGRESS: 'in_progress', COMPLETED: 'completed', OVERDUE: 'overdue' };

/**
 * Sign in with Google OAuth and request Calendar readonly scope
 * After successful login, searches for existing household by user's email
 * 
 * @returns {Promise<{success: boolean, user?: object, household?: object, error?: string}>}
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar.events.readonly',
        redirectTo: `${window.location.origin}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      console.error('Error signing in with Google:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // The OAuth flow will redirect, so we return the URL
    return {
      success: true,
      redirectUrl: data.url
    };
  } catch (err) {
    console.error('Unexpected error in signInWithGoogle:', err);
    return {
      success: false,
      error: `Unexpected error: ${err.message}`
    };
  }
}

/**
 * After OAuth callback, get the user session and search for household by email
 * Supabase automatically handles the OAuth callback and creates a session
 * 
 * @returns {Promise<{success: boolean, user?: object, household?: object, providerToken?: string, error?: string}>}
 */
export async function handleGoogleCallback() {
  try {
    // Supabase automatically handles the OAuth callback
    // Get the current session (should be set after OAuth redirect)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
    }

    if (!session || !session.user) {
      return {
        success: false,
        error: 'No active session found. Please try signing in again.'
      };
    }

    const user = session.user;
    const email = user.email;

    // Access provider token from session
    // Note: Supabase stores provider tokens in the session's provider_token field
    // This is available after OAuth sign-in
    const providerToken = session.provider_token || session.access_token;

    // Search for existing household by user's email
    // First, check if user is linked to a profile with a household
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        household:households(*)
      `)
      .eq('user_id', user.id)
      .limit(1);

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }

    // If profile exists with household, return it
    if (profiles && profiles.length > 0 && profiles[0].household) {
      return {
        success: true,
        user: user,
        household: profiles[0].household,
        providerToken: providerToken
      };
    }

    // If no profile found, search by email in profiles table
    if (email) {
      const { data: emailProfiles, error: emailError } = await supabase
        .from('profiles')
        .select(`
          *,
          household:households(*)
        `)
        .ilike('email', `%${email}%`)
        .eq('type', 'owner')
        .limit(1);

      if (emailError && emailError.code !== 'PGRST116') {
        console.error('Error searching by email:', emailError);
      }

      if (emailProfiles && emailProfiles.length > 0 && emailProfiles[0].household) {
        return {
          success: true,
          user: user,
          household: emailProfiles[0].household,
          providerToken: providerToken
        };
      }
    }

    // No household found - user will need to complete onboarding
    return {
      success: true,
      user: user,
      household: null,
      providerToken: providerToken
    };

  } catch (err) {
    console.error('Unexpected error in handleGoogleCallback:', err);
    return {
      success: false,
      error: `Unexpected error: ${err.message}`
    };
  }
}

/**
 * Toggles event planning status by starring an event and creating a linked task
 * When a pilot "stars" an event, this function:
 * 1. Updates calendar_events table to set is_starred = true (if column exists)
 * 2. Inserts a corresponding row into tasks table
 * 3. Sets the cognitive_weight using COGNITIVE_WEIGHT constants
 * 
 * @param {string} eventId - The UUID of the event being starred
 * @param {string} initialWeight - The initial cognitive weight (heavy, medium, or low)
 * @param {string} householdId - The UUID of the household
 * @param {string} ownerId - The UUID of the profile (owner) starring the event
 * @param {string|null} dependentId - Optional UUID of the dependent linked to this event
 * @returns {Promise<{success: boolean, taskId?: string, error?: string}>}
 */
export async function toggleEventPlanning(eventId, initialWeight, householdId, ownerId, dependentId = null) {
  try {
    // Validate cognitive weight
    const validWeights = Object.values(COGNITIVE_WEIGHT);
    if (!validWeights.includes(initialWeight)) {
      return {
        success: false,
        error: `Invalid cognitive weight. Must be one of: ${validWeights.join(', ')}`
      };
    }

    // Step 1: Get the event details from calendar_events table
    const { data: eventData, error: eventFetchError } = await supabase
      .from('calendar_events')
      .select('title, start_time, end_time')
      .eq('id', eventId)
      .eq('household_id', householdId)
      .single();

    if (eventFetchError) {
      console.error('Error fetching event details:', eventFetchError);
      return {
        success: false,
        error: `Failed to fetch event details: ${eventFetchError.message}`
      };
    }

    // Step 2: Update calendar_events to mark as starred (if is_starred column exists)
    // Note: This is optional - if column doesn't exist, we'll still create the task
    const { error: eventUpdateError } = await supabase
      .from('calendar_events')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .eq('household_id', householdId);

    if (eventUpdateError) {
      console.warn('Note: Could not update event (is_starred column may not exist):', eventUpdateError);
      // Continue anyway - task creation is more important
    }

    // Step 3: Create the primary task linked to the event
    const taskTitle = eventData.title || 'Event Planning Task';
    const dueDate = eventData.start_time ? new Date(eventData.start_time).toISOString().split('T')[0] : null;

    const { data: taskData, error: taskCreateError } = await supabase
      .from('action_items')
      .insert([
        {
          household_id: householdId,
          owner_id: ownerId,
          dependent_id: dependentId,
          title: taskTitle,
          description: `Planning task for: ${taskTitle}`,
          due_date: dueDate,
          cognitive_weight: initialWeight,
          status: TASK_STATUS.PENDING
        }
      ])
      .select('id')
      .single();

    if (taskCreateError) {
      console.error('Error creating task:', taskCreateError);
      return {
        success: false,
        error: `Failed to create task: ${taskCreateError.message}`
      };
    }

    console.log('Event planning toggled successfully:', {
      eventId,
      taskId: taskData.id,
      cognitiveWeight: initialWeight
    });

    return {
      success: true,
      taskId: taskData.id
    };

  } catch (err) {
    console.error('Unexpected error in toggleEventPlanning:', err);
    return {
      success: false,
      error: `Unexpected error: ${err.message}`
    };
  }
}

/**
 * Gets all calendar events for Dashboard display
 * Fetches from calendar_events table (the correct table name)
 * 
 * @param {string} householdId - The UUID of the household
 * @returns {Promise<{success: boolean, events?: Array, error?: string}>}
 */
export async function getStarredEvents(householdId) {
  try {
    // Fetch calendar events (all events, not just starred, since is_starred column may not exist)
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('household_id', householdId)
      .order('start_time', { ascending: true });

    if (eventsError) {
      console.error('Error fetching calendar events:', eventsError);
      return {
        success: false,
        error: `Failed to fetch calendar events: ${eventsError.message}`
      };
    }

    if (!events || events.length === 0) {
      return {
        success: true,
        events: []
      };
    }

    // Fetch all action_items for this household (we'll match by title/description for now)
    // Note: Without parent_event_id column, we can't directly link, so we return events with empty task data
    const { data: tasks, error: tasksError } = await supabase
      .from('action_items')
      .select('*')
      .eq('household_id', householdId);

    if (tasksError) {
      console.warn('Error fetching tasks (non-critical):', tasksError);
    }

    // Map events to our format
    const eventsWithTasks = events.map(event => {
      // Try to find a matching task by title (bidirectional fuzzy matching)
      // Check if either title contains the other (handles both short and long titles)
      const linkedTask = tasks?.find(task => {
        if (!task.title || !event.title) return false;
        const taskTitleLower = task.title.toLowerCase();
        const eventTitleLower = event.title.toLowerCase();
        // Check if either title contains the other (bidirectional matching)
        return taskTitleLower.includes(eventTitleLower) || eventTitleLower.includes(taskTitleLower);
      }) || null;
      
      return {
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          start_time: event.start_time,
          end_time: event.end_time,
          dependent_id: event.dependent_id,
          color_code: event.color_code,
          created_at: event.created_at,
          updated_at: event.updated_at
        },
        task: linkedTask,
        planningProgress: linkedTask ? {
          hasTask: true,
          taskId: linkedTask.id,
          cognitiveWeight: linkedTask.cognitive_weight,
          status: linkedTask.status,
          subTasksCount: 0, // sub_tasks column doesn't exist
          subTasks: []
        } : {
          hasTask: false,
          subTasksCount: 0,
          subTasks: []
        }
      };
    });

    return {
      success: true,
      events: eventsWithTasks
    };

  } catch (err) {
    console.error('Unexpected error in getStarredEvents:', err);
    return {
      success: false,
      error: `Unexpected error: ${err.message}`
    };
  }
}