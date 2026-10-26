import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from || '/'

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      // Redirect based on role
      if (user.role === 'customer') navigate(from === '/' ? '/dashboard' : from, { replace: true })
      else navigate('/staff', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.cardHeader}>
          <div style={s.logo}>🏨</div>
          <h1 style={s.title}>Welcome Back</h1>
          <p style={s.subtitle}>Sign in to manage your reservations</p>
        </div>

        <div style={s.body}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" required placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" required placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
              disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={s.switchText}>
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </p>

          {/* Dev helper */}
          <details style={s.devHint}>
            <summary style={{ cursor: 'pointer', fontSize: '0.78rem', color: '#6c757d' }}>🔧 Dev credentials</summary>
            <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#6c757d', lineHeight: '1.7' }}>
              <strong>Admin:</strong> admin@grandhorizon.example / Admin@12345<br />
              <strong>Staff:</strong> receptionist@grandhorizon.example / Staff@12345<br />
              <em>Run <code>node src/scripts/seed.js</code> in the server folder to create these accounts.</em>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

const s = {
  page:      { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a3c5e 0%, #2d5a8e 100%)', padding: '2rem' },
  card:      { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' },
  cardHeader:{ background: '#1a3c5e', padding: '2rem 2rem 1.5rem', textAlign: 'center' },
  logo:      { fontSize: '2.5rem', marginBottom: '0.5rem' },
  title:     { color: '#fff', fontSize: '1.5rem', marginBottom: '0.25rem' },
  subtitle:  { color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem' },
  body:      { padding: '2rem' },
  switchText:{ textAlign: 'center', fontSize: '0.88rem', color: '#6c757d', marginTop: '1.5rem' },
  devHint:   { marginTop: '1.5rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' },
}
