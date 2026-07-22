import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { colors } from '../constants/colors'
import SizeSelector from '../components/SizeSelector'

const SHOE_SIZE_OPTIONS = Array.from({ length: 21 }, (_, i) => (4 + i * 0.5).toString());

export default function ProfilePage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [sizeTopSystem, setSizeTopSystem] = useState('Alpha')
  const [sizeTop, setSizeTop] = useState('')
  const [sizeBottomSystem, setSizeBottomSystem] = useState('Alpha')
  const [sizeBottom, setSizeBottom] = useState('')
  const [sizeShoe, setSizeShoe] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setEmail(user.email)

    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, size_top, size_top_system, size_bottom, size_bottom_system, size_shoe')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error loading profile:', error)
    } else if (data) {
      setFirstName(data.first_name || '')
      setSizeTop(data.size_top || '')
      setSizeTopSystem(data.size_top_system || 'Alpha')
      setSizeBottom(data.size_bottom || '')
      setSizeBottomSystem(data.size_bottom_system || 'Alpha')
      setSizeShoe(data.size_shoe || '')
    }
    setLoading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        size_top: sizeTop,
        size_top_system: sizeTopSystem,
        size_bottom: sizeBottom,
        size_bottom_system: sizeBottomSystem,
        size_shoe: sizeShoe,
      })
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <p style={{ color: colors.text }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-10" style={{ backgroundColor: colors.background }}>
      <div className="max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1 mb-4 text-sm font-semibold"
          style={{ color: colors.text }}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="rounded-lg shadow-lg p-8" style={{ backgroundColor: colors.card }}>
          <h1 className="font-serif text-3xl font-bold mb-1" style={{ color: colors.text }}>Profile</h1>
          <p className="text-sm mb-6" style={{ color: colors.text, opacity: 0.7 }}>{email}</p>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium" style={{ color: colors.text }}>
                First name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm"
                style={{ borderColor: colors.buttons, color: colors.text }}
                required
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
                value={sizeShoe}
                onChange={(e) => setSizeShoe(e.target.value)}
                className="w-full px-2 py-2 border rounded text-sm"
                style={{ borderColor: colors.buttons, color: colors.text }}
                required
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

            {saved && (
              <p className="text-sm rounded-md px-3 py-2" style={{ backgroundColor: colors.buttons, color: colors.text }}>
                Saved!
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full font-semibold rounded-lg py-2.5 transition disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: colors.banner, color: colors.text }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold transition hover:opacity-90"
            style={{ backgroundColor: colors.buttons, color: colors.text }}
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}