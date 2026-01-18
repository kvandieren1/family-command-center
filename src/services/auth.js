import { supabase } from '../lib/supabase';

/**
 * Sign in with GitHub OAuth
 * @returns {Promise<{success: boolean, redirectUrl?: string, error?: string}>}
 */
export async function signInWithGitHub() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}`,
      }
    });

    if (error) {
      console.error('Error signing in with GitHub:', error);
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
    console.error('Unexpected error in signInWithGitHub:', err);
    return {
      success: false,
      error: `Unexpected error: ${err.message}`
    };
  }
}

/**
 * Determine user role based on email
 * @param {string} email - User's email address
 * @returns {string} - 'Pilot' or 'Co-Pilot'
 */
export function determineUserRole(email) {
  if (!email) return 'Co-Pilot';
  
  // Get the primary pilot email from environment or use a default
  // You can set VITE_PRIMARY_PILOT_EMAIL in .env or hardcode it
  const primaryPilotEmail = import.meta.env.VITE_PRIMARY_PILOT_EMAIL || 'kvandieren1@gmail.com';
  
  // Normalize emails for comparison (case-insensitive)
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPrimary = primaryPilotEmail.toLowerCase().trim();
  
  return normalizedEmail === normalizedPrimary ? 'Pilot' : 'Co-Pilot';
}
