import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { api } from '../../lib/axios.js'
import { setAuth } from '../../store/auth.slice.js'

const fields = [
  { field: 'name', label: 'Your name', type: 'text', placeholder: 'Alice' },
  { field: 'orgName', label: 'Organization', type: 'text', placeholder: 'Acme Inc.' },
  { field: 'email', label: 'Email', type: 'email', placeholder: 'you@company.com' },
  { field: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
] as const

export function Register() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [form, setForm] = useState({ email: '', password: '', name: '', orgName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      dispatch(setAuth(data))
      navigate('/dashboard')
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-[380px] animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-10 h-10 rounded-xl bg-btn-bg flex items-center justify-center mb-5">
            <span className="text-btn-text font-semibold text-lg leading-none">G</span>
          </div>
          <h1 className="text-[22px] font-medium text-text-primary tracking-[-0.02em]">Create your account</h1>
          <p className="text-[14px] text-text-tertiary mt-1.5">Start tracking in minutes</p>
        </div>

        <div className="bg-surface-1 border border-border rounded-2xl p-7">
          {error && (
            <div className="mb-6 px-3.5 py-2.5 bg-red-500/[0.06] border border-red-500/10 text-red-400 rounded-xl text-[13px]">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map(({ field, label, type, placeholder }) => (
              <div key={field}>
                <label className="block text-[13px] text-text-secondary mb-2">{label}</label>
                <input
                  type={type}
                  value={form[field]}
                  onChange={(e) => update(field, e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-surface border border-border-strong rounded-xl px-3.5 py-2.5 text-[14px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:ring-1 focus:ring-accent-hover focus:border-border-strong transition-all"
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-btn-bg hover:bg-btn-hover disabled:opacity-50 disabled:cursor-not-allowed text-btn-text py-2.5 rounded-xl text-[14px] font-medium transition-all"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-text-quaternary mt-6">
          Have an account?{' '}
          <Link to="/login" className="text-text-secondary hover:text-text-primary transition-colors underline underline-offset-2 decoration-border-strong">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
