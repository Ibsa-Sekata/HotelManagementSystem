import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setMenuOpen(false)
  }

  const dashboardPath = () => {
    if (!user) return '/login'
    if (user.role === 'customer') return '/dashboard'
    return '/staff'
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.inner} className="container">
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>🏨</span>
          <span>
            <span style={styles.logoMain}>Grand Horizon</span>
            <span style={styles.logoSub}> Hotel</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div style={styles.links}>
          <NavLink to="/"       style={navStyle} end>Home</NavLink>
          <NavLink to="/rooms"  style={navStyle}>Rooms</NavLink>

          {isAuthenticated ? (
            <>
              <NavLink to={dashboardPath()} style={navStyle}>Dashboard</NavLink>
              <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
              <div style={styles.avatar}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login"    style={navStyle}>Sign In</NavLink>
              <Link    to="/register" style={styles.cta}>Book Now</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button style={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          <Link to="/"      onClick={() => setMenuOpen(false)} style={styles.mobileLink}>Home</Link>
          <Link to="/rooms" onClick={() => setMenuOpen(false)} style={styles.mobileLink}>Rooms</Link>
          {isAuthenticated ? (
            <>
              <Link to={dashboardPath()} onClick={() => setMenuOpen(false)} style={styles.mobileLink}>Dashboard</Link>
              <button onClick={handleLogout} style={{ ...styles.mobileLink, background: 'none', border: 'none', textAlign: 'left', width: '100%' }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login"    onClick={() => setMenuOpen(false)} style={styles.mobileLink}>Sign In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} style={styles.mobileLink}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

const navStyle = ({ isActive }) => ({
  color: isActive ? '#c9a84c' : 'rgba(255,255,255,0.88)',
  fontWeight: isActive ? '600' : '400',
  fontSize: '0.93rem',
  textDecoration: 'none',
  transition: 'color 0.2s',
  padding: '0.3rem 0',
  borderBottom: isActive ? '2px solid #c9a84c' : '2px solid transparent',
})

const styles = {
  nav: {
    background: '#1a3c5e',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
  },
  logoIcon: { fontSize: '1.5rem' },
  logoMain: { color: '#fff', fontWeight: '700', fontSize: '1.1rem' },
  logoSub:  { color: '#c9a84c', fontWeight: '400', fontSize: '1.1rem' },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  cta: {
    background: '#c9a84c',
    color: '#1a3c5e',
    padding: '0.45rem 1.2rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.9rem',
    textDecoration: 'none',
    transition: 'background 0.2s',
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.4)',
    color: 'rgba(255,255,255,0.88)',
    padding: '0.35rem 0.9rem',
    borderRadius: '6px',
    fontSize: '0.88rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  avatar: {
    width: '34px',
    height: '34px',
    background: '#c9a84c',
    color: '#1a3c5e',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.78rem',
  },
  hamburger: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '1.4rem',
    cursor: 'pointer',
    '@media(maxWidth:768px)': { display: 'block' },
  },
  mobileMenu: {
    background: '#0f2540',
    display: 'flex',
    flexDirection: 'column',
  },
  mobileLink: {
    color: 'rgba(255,255,255,0.85)',
    padding: '0.85rem 1.5rem',
    textDecoration: 'none',
    fontSize: '0.95rem',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'block',
  },
}
