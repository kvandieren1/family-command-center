import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
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
            disabled={loading}
            className="w-full py-2 bg-terminal-accent text-terminal-bg font-bold active:opacity-80 disabled:opacity-50 touch-none"
          >
            {loading ? 'PROCESSING...' : isSignUp ? 'SIGN UP' : 'SIGN IN'}
          </button>
        </form>
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
