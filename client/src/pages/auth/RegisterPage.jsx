import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const rules = [
  { re: /.{8,}/,     label: 'At least 8 characters' },
  { re: /[A-Z]/,     label: 'One uppercase letter' },
  { re: /[a-z]/,     label: 'One lowercase letter' },
  { re: /[0-9]/,     label: 'One number' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form,    setForm]    = useState({ firstName: '', lastName: '', email: '', password: '', phone: '' })
  const [errors,  setErrors]  = useState({})
  const [apiError,setApiError]= useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required'
    if (!form.lastName.trim())  e.lastName  = 'Last name is required'
    if (!form.email.trim())     e.email     = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password)         e.password  = 'Password is required'
    else {
      const failedRules = rules.filter(r => !r.re.test(form.password))
      if (failedRules.length) e.password = failedRules.map(r => r.label).join(', ')
    }
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const data = err.response?.data
      if (data?.errors?.length) {
        const mapped = {}
        data.errors.forEach(({ field, message }) => { mapped[field] = message })
        setErrors(mapped)
      } else {
        setApiError(data?.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const field = (name) => ({
    className: `form-control${errors[name] ? ' error' : ''}`,
    value: form[name],
    onChange: (e) => { setForm({ ...form, [name]: e.target.value }); setErrors({ ...errors, [name]: '' }) },
  })

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.cardHeader}>
          <div style={s.logo}>🏨</div>
          <h1 style={s.title}>Create Account</h1>
          <p style={s.subtitle}>Join Grand Horizon Hotel</p>
        </div>

        <div style={s.body}>
          {apiError && <div className="alert alert-error">{apiError}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input type="text" placeholder="Abebe" required {...field('firstName')} />
                {errors.firstName && <p className="form-error">{errors.firstName}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input type="text" placeholder="Girma" required {...field('lastName')} />
                {errors.lastName && <p className="form-error">{errors.lastName}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" placeholder="your@email.com" required {...field('email')} />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input type="tel" placeholder="+251 91 234 5678" {...field('phone')} />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" placeholder="Min 8 chars, 1 upper, 1 lower, 1 number" required {...field('password')} />
              {errors.password && <p className="form-error">{errors.password}</p>}
              {/* password strength hints */}
              {form.password && (
                <div style={s.pwRules}>
                  {rules.map(r => (
                    <span key={r.label} style={{ ...s.pwRule, color: r.re.test(form.password) ? '#198754' : '#adb5bd' }}>
                      {r.re.test(form.password) ? '✓' : '○'} {r.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
              disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p style={s.switchText}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const s = {
  page:      { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a3c5e 0%, #2d5a8e 100%)', padding: '2rem' },
  card:      { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' },
  cardHeader:{ background: '#1a3c5e', padding: '2rem 2rem 1.5rem', textAlign: 'center' },
  logo:      { fontSize: '2.5rem', marginBottom: '0.5rem' },
  title:     { color: '#fff', fontSize: '1.5rem', marginBottom: '0.25rem' },
  subtitle:  { color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem' },
  body:      { padding: '2rem' },
  pwRules:   { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' },
  pwRule:    { fontSize: '0.72rem', transition: 'color 0.2s' },
  switchText:{ textAlign: 'center', fontSize: '0.88rem', color: '#6c757d', marginTop: '1.5rem' },
}
