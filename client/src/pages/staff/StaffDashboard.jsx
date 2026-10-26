import React from 'react'
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import StaffOverview      from './StaffOverview'
import RoomManagement     from './RoomManagement'
import ReceptionDesk      from './ReceptionDesk'
import HousekeepingBoard  from './HousekeepingBoard'
import ReportsPage        from './ReportsPage'

export default function StaffDashboard() {
  const { user, logout } = useAuth()
  const isAdmin   = ['admin'].includes(user?.role)
  const isManager = ['admin', 'manager'].includes(user?.role)

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div style={s.userCard}>
          <div style={s.avatar}>{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
          <div style={s.userName}>{user?.firstName} {user?.lastName}</div>
          <div style={s.userRole}>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">Operations</div>
          <NavLink to="/staff/overview"      className={({ isActive }) => isActive ? 'active' : ''}>📊 Overview</NavLink>
          <NavLink to="/staff/reception"     className={({ isActive }) => isActive ? 'active' : ''}>🛎️ Reception</NavLink>
          <NavLink to="/staff/housekeeping"  className={({ isActive }) => isActive ? 'active' : ''}>🧹 Housekeeping</NavLink>

          {isManager && (
            <>
              <div className="sidebar-section">Management</div>
              <NavLink to="/staff/rooms"    className={({ isActive }) => isActive ? 'active' : ''}>🏨 Room Management</NavLink>
              <NavLink to="/staff/reports"  className={({ isActive }) => isActive ? 'active' : ''}>📈 Reports</NavLink>
            </>
          )}

          <div className="sidebar-section">Account</div>
          <NavLink to="/staff/profile" className={({ isActive }) => isActive ? 'active' : ''}>👤 Profile</NavLink>
        </nav>
      </aside>

      <main className="dashboard-content">
        <Routes>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview"     element={<StaffOverview />} />
          <Route path="reception"    element={<ReceptionDesk />} />
          <Route path="housekeeping" element={<HousekeepingBoard />} />
          <Route path="rooms"        element={<RoomManagement />} />
          <Route path="reports"      element={<ReportsPage />} />
          <Route path="profile"      element={<div style={{ padding: '1rem' }}><p>Staff profile — same as customer profile component</p></div>} />
        </Routes>
      </main>
    </div>
  )
}

const s = {
  userCard: { padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', marginBottom: '0.5rem' },
  avatar:   { width: '56px', height: '56px', background: '#c9a84c', color: '#1a3c5e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.1rem', margin: '0 auto 0.75rem' },
  userName: { color: '#fff', fontWeight: '600', fontSize: '0.95rem' },
  userRole: { color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '0.2rem', textTransform: 'capitalize' },
}
