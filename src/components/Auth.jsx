import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { signInWithGitHub } from '../services/auth'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubLogin = async () => {
    setGithubLoading(true)
    setError(null)

    try {
      const result = await signInWithGitHub()
      if (!result.success) {
        setError(result.error || 'Failed to sign in with GitHub')
        setGithubLoading(false)
      }
      // If successful, the OAuth flow will redirect, so we don't need to do anything else
    } catch (error) {
      setError(error.message)
      setGithubLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-terminal-bg">
      <div className="w-full max-w-md p-8 border border-terminal-border bg-terminal-surface">
        <h1 className="text-2xl mb-6 text-terminal-accent font-bold">
          FAMILY COMMAND CENTER
        </h1>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border text-terminal-text focus:outline-none focus:border-terminal-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border text-terminal-text focus:outline-none focus:border-terminal-accent"
              required
            />
          </div>
          {error && (
            <div className="text-terminal-error text-sm">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading || githubLoading}
            className="w-full py-2 bg-terminal-accent text-terminal-bg font-bold active:opacity-80 disabled:opacity-50 touch-none"
          >
            {loading ? 'PROCESSING...' : isSignUp ? 'SIGN UP' : 'SIGN IN'}
          </button>
        </form>
        
        {/* GitHub OAuth Button */}
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-terminal-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-terminal-surface text-terminal-text">Or</span>
            </div>
          </div>
          <button
            onClick={handleGitHubLogin}
            disabled={loading || githubLoading}
            className="mt-4 w-full py-2 bg-slate-800 border border-slate-700 text-white font-semibold rounded active:bg-slate-700 disabled:opacity-50 touch-none flex items-center justify-center gap-2"
          >
            {githubLoading ? (
              'CONNECTING...'
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.27.098-2.647 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.377.202 2.394.1 2.647.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.197 22 16.425 22 12.017 22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Pilot Login
              </>
            )}
          </button>
        </div>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-4 text-sm text-terminal-text opacity-70 active:opacity-100 touch-none"
        >
          {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>
      </div>
    </div>
  )
}
