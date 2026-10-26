import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={s.footer}>
      <div className="container" style={s.grid}>
        <div>
          <div style={s.logo}>🏨 Grand Horizon Hotel</div>
          <p style={s.tagline}>Your Home Away From Home</p>
          <p style={s.address}>123 Bole Road, Addis Ababa, Ethiopia</p>
          <p style={s.address}>📞 +251 11 000 0000</p>
          <p style={s.address}>✉ info@grandhorizon.example</p>
        </div>

        <div>
          <h4 style={s.colTitle}>Quick Links</h4>
          <div style={s.linkList}>
            <Link to="/"        style={s.link}>Home</Link>
            <Link to="/rooms"   style={s.link}>Room Catalog</Link>
            <Link to="/login"   style={s.link}>Sign In</Link>
            <Link to="/register" style={s.link}>Register</Link>
          </div>
        </div>

        <div>
          <h4 style={s.colTitle}>Policies</h4>
          <div style={s.linkList}>
            <span style={s.policyText}>Check-in: 14:00</span>
            <span style={s.policyText}>Check-out: 11:00</span>
            <span style={s.policyText}>Free cancellation ≥ 48h before</span>
            <span style={s.policyText}>Late cancel: 50% first night</span>
          </div>
        </div>
      </div>

      <div style={s.bottom}>
        <p>© {new Date().getFullYear()} Grand Horizon Hotel · All rights reserved</p>
        <p style={{ marginTop: '.25rem', fontSize: '.78rem', opacity: .6 }}>
          Hotel Management System — Development Build
        </p>
      </div>
    </footer>
  )
}

const s = {
  footer:    { background: '#0f2540', color: 'rgba(255,255,255,.8)', padding: '3rem 0 0', marginTop: '4rem' },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', paddingBottom: '2rem' },
  logo:      { color: '#c9a84c', fontWeight: '700', fontSize: '1.15rem', marginBottom: '.5rem' },
  tagline:   { fontSize: '.88rem', marginBottom: '.5rem', opacity: .8 },
  address:   { fontSize: '.82rem', opacity: .7, marginBottom: '.2rem' },
  colTitle:  { color: '#c9a84c', marginBottom: '.75rem', fontSize: '.9rem', textTransform: 'uppercase', letterSpacing: '.08em' },
  linkList:  { display: 'flex', flexDirection: 'column', gap: '.45rem' },
  link:      { color: 'rgba(255,255,255,.75)', fontSize: '.88rem', textDecoration: 'none' },
  policyText:{ fontSize: '.82rem', opacity: .7 },
  bottom:    { borderTop: '1px solid rgba(255,255,255,.1)', padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '.82rem', opacity: .6 },
}
