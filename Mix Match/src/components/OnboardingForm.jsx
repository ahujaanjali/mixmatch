import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { colors } from '../constants/colors'
import SizeSelector from './SizeSelector'

const SHOE_SIZE_OPTIONS = Array.from({ length: 21 }, (_, i) => (4 + i * 0.5).toString()); // 4 to 14

export default function OnboardingForm({ userId, onComplete }) {
  const [firstName, setFirstName] = useState('')
  const [sizeTopSystem, setSizeTopSystem] = useState('Alpha')
  const [sizeTop, setSizeTop] = useState('')
  const [sizeBottomSystem, setSizeBottomSystem] = useState('Alpha')
  const [sizeBottom, setSizeBottom] = useState('')
  const [sizeShoe, setSizeShoe] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        size_top: sizeTop,
        size_top_system: sizeTopSystem,
        size_bottom: sizeBottom,
        size_bottom_system: sizeBottomSystem,
        size_shoe: sizeShoe,
      })
      .eq('id', userId)
      .select()
      .single()

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    onComplete(data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: colors.background }}>
      <div className="w-full max-w-sm rounded-lg shadow-lg p-8" style={{ backgroundColor: colors.card }}>
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold" style={{ color: colors.text }}>Welcome to Mix Match</h1>
          <p className="text-sm mt-2" style={{ color: colors.text, opacity: 0.7 }}>
            Let's set up your profile — you can change this anytime.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
              First name
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
              style={{ borderColor: colors.buttons, color: colors.text }}
              placeholder="Jamie"
            />
          </div>

          <SizeSelector
            label="Top"
            system={sizeTopSystem}
            onSystemChange={setSizeTopSystem}
            value={sizeTop}
            onValueChange={setSizeTop}
            allowedSystems={['US', 'Alpha']}
          />

          <SizeSelector
            label="Bottom"
            system={sizeBottomSystem}
            onSystemChange={setSizeBottomSystem}
            value={sizeBottom}
            onValueChange={setSizeBottom}
            allowedSystems={['US', 'Alpha', 'Denim']}
          />

          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: colors.text }}>
              Shoe
            </label>
            <select
              required
              value={sizeShoe}
              onChange={(e) => setSizeShoe(e.target.value)}
              className="w-full px-2 py-2 border rounded text-sm"
              style={{ borderColor: colors.buttons, color: colors.text }}
            >
              <option value="" disabled>—</option>
              {SHOE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {error && (
            <p className="text-sm rounded-md px-3 py-2" style={{ backgroundColor: '#FBEAEA', color: '#B3261E' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold rounded-lg py-2.5 transition disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: colors.banner, color: colors.text }}
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}