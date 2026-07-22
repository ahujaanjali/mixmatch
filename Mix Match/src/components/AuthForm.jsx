import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      setLoading(false)

      if (error) {
        setError(error.message)
        return
      }

      // If "Confirm email" is on in Supabase, there's no session yet.
      if (!data.session) {
        setMessage('Check your email to confirm your account before logging in.')
        return
      }

      onAuthSuccess?.(data.session)
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)

      if (error) {
        setError(error.message)
        return
      }

      onAuthSuccess?.(data.session)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Mix Match</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {mode === 'login' ? 'Log in to your closet' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
          )}

          {message && (
            <p className="text-sm text-emerald-700 bg-emerald-50 rounded-md px-3 py-2">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white text-sm font-medium rounded-lg py-2.5
                       hover:bg-neutral-800 transition disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError(null)
              setMessage(null)
            }}
            className="text-neutral-900 font-medium underline underline-offset-2"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}