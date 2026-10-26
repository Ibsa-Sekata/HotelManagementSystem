import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import CustomerBookings from './CustomerBookings'
import CustomerProfile  from './CustomerProfile'

export default function CustomerDashboard() {
  const { user } = useAuth()

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={s.userCard}>
          <div style={s.avatar}>{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
          <div style={s.userName}>{user?.firstName} {user?.lastName}</div>
          <div style={s.userRole}>Guest Account</div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">Menu</div>
          <NavLink to="/dashboard/bookings" className={({ isActive }) => isActive ? 'active' : ''}>
            🛎️ My Bookings
          </NavLink>
          <NavLink to="/dashboard/profile" className={({ isActive }) => isActive ? 'active' : ''}>
            👤 My Profile
          </NavLink>
          <NavLink to="/rooms">🏨 Browse Rooms</NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <main className="dashboard-content">
        <Routes>
          <Route index element={<Navigate to="bookings" replace />} />
          <Route path="bookings" element={<CustomerBookings />} />
          <Route path="profile"  element={<CustomerProfile />} />
        </Routes>
      </main>
    </div>
  )
}

const s = {
  userCard: { padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', marginBottom: '0.5rem' },
  avatar:   { width: '56px', height: '56px', background: '#c9a84c', color: '#1a3c5e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.1rem', margin: '0 auto 0.75rem' },
  userName: { color: '#fff', fontWeight: '600', fontSize: '0.95rem' },
  userRole: { color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '0.2rem' },
}
