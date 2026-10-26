import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/auth.api'

export default function CustomerProfile() {
  const { user, updateUser } = useAuth()
  const [form,    setForm]    = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '' })
  const [success, setSuccess] = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const [pwForm,   setPwForm]  = useState({ currentPassword: '', newPassword: '' })
  const [pwMsg,    setPwMsg]   = useState('')
  const [pwErr,    setPwErr]   = useState('')
  const [pwLoad,   setPwLoad]  = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSuccess(''); setError(''); setLoading(true)
    try {
      const { data } = await authApi.updateMe(form)
      updateUser(data.user)
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.')
    } finally { setLoading(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwMsg(''); setPwErr(''); setPwLoad(true)
    try {
      await authApi.changePassword(pwForm)
      setPwMsg('Password changed. Please log in again on other devices.')
      setPwForm({ currentPassword: '', newPassword: '' })
    } catch (err) {
      setPwErr(err.response?.data?.message || 'Password change failed.')
    } finally { setPwLoad(false) }
  }

  return (
    <div>
      <h2 style={s.h2}>My Profile</h2>
      <p style={s.subtitle}>Update your account information</p>

      <div style={s.grid}>
        {/* Profile info */}
        <div style={s.section}>
          <h3 style={s.sectionH}>Personal Information</h3>
          {success && <div className="alert alert-success">{success}</div>}
          {error   && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleProfileSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input type="text" className="form-control" value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input type="text" className="form-control" value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email (cannot be changed)</label>
              <input type="email" className="form-control" value={user?.email || ''} disabled style={{ background: '#f8f9fa', color: '#6c757d' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="tel" className="form-control" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251 91 234 5678" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div style={s.section}>
          <h3 style={s.sectionH}>Change Password</h3>
          {pwMsg && <div className="alert alert-success">{pwMsg}</div>}
          {pwErr && <div className="alert alert-error">{pwErr}</div>}
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-control" required
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-control" required
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
              <p className="form-hint">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</p>
            </div>
            <button type="submit" className="btn btn-outline" disabled={pwLoad}>
              {pwLoad ? 'Changing…' : 'Change Password'}
            </button>
          </form>

          {/* Account info */}
          <div style={s.infoBox}>
            <p style={s.infoLabel}>Account type</p>
            <p style={s.infoValue}>{user?.role === 'customer' ? 'Guest Account' : user?.role}</p>
            <p style={s.infoLabel}>Member since</p>
            <p style={s.infoValue}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '—'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  h2:       { fontSize: '1.5rem', color: '#1a3c5e', marginBottom: '0.2rem' },
  subtitle: { color: '#6c757d', fontSize: '0.9rem', marginBottom: '2rem' },
  grid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' },
  section:  { background: '#fff', border: '1px solid #dee2e6', borderRadius: '12px', padding: '1.5rem' },
  sectionH: { fontSize: '1rem', fontWeight: '600', color: '#1a3c5e', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #dee2e6' },
  infoBox:  { marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #dee2e6' },
  infoLabel:{ fontSize: '0.75rem', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.75rem' },
  infoValue:{ fontSize: '0.95rem', color: '#212529', fontWeight: '500' },
}
