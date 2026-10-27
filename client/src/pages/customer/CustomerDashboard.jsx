import { NavLink, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import CustomerBookings from "./CustomerBookings"
import CustomerProfile from "./CustomerProfile"

export default function CustomerDashboard() {
  const { user } = useAuth()
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
          <div className="sidebar-name">{user?.firstName} {user?.lastName}</div>
          <div className="sidebar-role">Guest Account</div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section">My Account</div>
          <NavLink to="/dashboard/bookings" className={({isActive})=>isActive?"active":""}>🛎️ My Bookings</NavLink>
          <NavLink to="/dashboard/profile"  className={({isActive})=>isActive?"active":""}>👤 My Profile</NavLink>
          <div className="sidebar-section">Explore</div>
          <NavLink to="/rooms">🏨 Browse Rooms</NavLink>
        </nav>
      </aside>
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
