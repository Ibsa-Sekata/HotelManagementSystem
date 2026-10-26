import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar         from './components/common/Navbar'
import Footer         from './components/common/Footer'
import ProtectedRoute from './components/common/ProtectedRoute'

// Public pages
import HomePage       from './pages/public/HomePage'
import RoomsPage      from './pages/public/RoomsPage'
import RoomDetailPage from './pages/public/RoomDetailPage'

// Auth pages
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Customer dashboard
import CustomerDashboard from './pages/customer/CustomerDashboard'

// Staff dashboard
import StaffDashboard from './pages/staff/StaffDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="page-wrapper">
          <Navbar />

          <main className="page-main">
            <Routes>
              {/* ── Public ── */}
              <Route path="/"           element={<HomePage />} />
              <Route path="/rooms"      element={<RoomsPage />} />
              <Route path="/rooms/:id"  element={<RoomDetailPage />} />
              <Route path="/login"      element={<LoginPage />} />
              <Route path="/register"   element={<RegisterPage />} />

              {/* ── Customer dashboard ── */}
              <Route path="/dashboard/*" element={
                <ProtectedRoute roles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              } />

              {/* ── Staff dashboard (receptionist, manager, admin) ── */}
              <Route path="/staff/*" element={
                <ProtectedRoute roles={['receptionist', 'manager', 'admin']}>
                  <StaffDashboard />
                </ProtectedRoute>
              } />

              {/* ── 404 ── */}
              <Route path="*" element={
                <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                  <span style={{ fontSize: '4rem' }}>🏨</span>
                  <h2 style={{ color: '#1a3c5e' }}>Page Not Found</h2>
                  <a href="/" className="btn btn-primary">Back to Home</a>
                </div>
              } />
            </Routes>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
