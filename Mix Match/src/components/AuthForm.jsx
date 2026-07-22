import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { colors } from '../constants/colors'

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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: colors.background }}>
      <div className="w-full max-w-sm rounded-lg shadow-lg p-8" style={{ backgroundColor: colors.card }}>
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold" style={{ color: colors.text }}>Mix Match</h1>
          <p className="text-sm mt-2" style={{ color: colors.text, opacity: 0.7 }}>
            {mode === 'login' ? 'Log in to your closet' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
              style={{ borderColor: colors.buttons, color: colors.text }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
              style={{ borderColor: colors.buttons, color: colors.text }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm rounded-md px-3 py-2" style={{ backgroundColor: '#FBEAEA', color: '#B3261E' }}>
              {error}
            </p>
          )}

          {message && (
            <p className="text-sm rounded-md px-3 py-2" style={{ backgroundColor: colors.buttons, color: colors.text }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold rounded-lg py-2.5 transition disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: colors.banner, color: colors.text }}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: colors.text, opacity: 0.8 }}>
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError(null)
              setMessage(null)
            }}
            className="font-semibold underline underline-offset-2"
            style={{ color: colors.text }}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}