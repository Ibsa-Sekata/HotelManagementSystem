import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { roomTypesApi } from '../../api/rooms.api'
import RoomCard from '../../components/rooms/RoomCard'

export default function HomePage() {
  const navigate = useNavigate()
  const [featuredRooms, setFeaturedRooms] = useState([])
  const [searchForm, setSearchForm] = useState({ checkIn: '', checkOut: '', guests: '2' })

  useEffect(() => {
    roomTypesApi.getAll()
      .then(({ data }) => setFeaturedRooms(Array.isArray(data?.data) ? data.data.slice(0, 3) : []))
      .catch(() => {}) // silently ignore if server is down — homepage still renders
  }, [])

  const { today, tomorrow } = useMemo(() => {
    const now = new Date()
    const nextDay = new Date(now.getTime() + 86400000)
    return {
      today: now.toISOString().split('T')[0],
      tomorrow: nextDay.toISOString().split('T')[0],
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchForm.checkIn)  params.set('checkIn', searchForm.checkIn)
    if (searchForm.checkOut) params.set('checkOut', searchForm.checkOut)
    if (searchForm.guests)   params.set('guests', searchForm.guests)
    navigate(`/rooms?${params.toString()}`)
  }

  return (
    <div>
      {/* Hero Section */}
      <section style={s.hero}>
        <div style={s.heroOverlay} />
        <div style={s.heroContent}>
          <div style={s.heroBadge}>✦ Welcome to Grand Horizon Hotel</div>
          <h1 style={s.heroH1}>Experience Luxury<br />in the Heart of Addis</h1>
          <p style={s.heroSub}>World-class comfort, authentic Ethiopian hospitality, and unforgettable memories.</p>

          {/* Search Widget */}
          <form style={s.searchCard} onSubmit={handleSearch}>
            <div style={s.searchRow}>
              <div style={s.searchField}>
                <label style={s.searchLabel}>Check In</label>
                <input type="date" style={s.searchInput} min={today}
                  value={searchForm.checkIn}
                  onChange={(e) => setSearchForm({ ...searchForm, checkIn: e.target.value })} />
              </div>
              <div style={s.searchField}>
                <label style={s.searchLabel}>Check Out</label>
                <input type="date" style={s.searchInput} min={searchForm.checkIn || tomorrow}
                  value={searchForm.checkOut}
                  onChange={(e) => setSearchForm({ ...searchForm, checkOut: e.target.value })} />
              </div>
              <div style={s.searchField}>
                <label style={s.searchLabel}>Guests</label>
                <select style={s.searchInput} value={searchForm.guests}
                  onChange={(e) => setSearchForm({ ...searchForm, guests: e.target.value })}>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <button type="submit" style={s.searchBtn}>Search Rooms</button>
            </div>
          </form>
        </div>
      </section>

      {/* Stats bar */}
      <section style={s.statsBar}>
        <div className="container" style={s.statsRow}>
          {[
            { icon: '🏆', label: 'Years of Excellence', value: '15+' },
            { icon: '🛏️', label: 'Luxury Rooms',         value: '87'  },
            { icon: '⭐', label: 'Guest Reviews',        value: '4.8' },
            { icon: '🍽️', label: 'Restaurant Awards',    value: '3'   },
          ].map((s2) => (
            <div key={s2.label} style={s.statItem}>
              <span style={s.statIcon}>{s2.icon}</span>
              <span style={s.statValue}>{s2.value}</span>
              <span style={s.statLabel}>{s2.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Rooms */}
      <section style={s.section}>
        <div className="container">
          <div className="section-header text-center">
            <h2>Our Room Categories</h2>
            <p>From comfortable standard rooms to lavish executive suites</p>
          </div>

          {featuredRooms.length > 0 ? (
            <div className="grid-3" style={{ marginBottom: '2rem' }}>
              {featuredRooms.map((room) => (
                <RoomCard key={room._id} room={room} />
              ))}
            </div>
          ) : (
            <div style={s.noRooms}>
              <p>Room catalog is loading… Make sure the backend server is running on port 5000.</p>
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <Link to="/rooms" className="btn btn-outline btn-lg">View All Rooms</Link>
          </div>
        </div>
      </section>

      {/* Amenities strip */}
      <section style={s.amenSection}>
        <div className="container">
          <div className="section-header text-center">
            <h2 style={{ color: '#fff' }}>Hotel Amenities</h2>
            <p style={{ color: 'rgba(255,255,255,.75)' }}>Everything you need for a perfect stay</p>
          </div>
          <div style={s.amenGrid}>
            {[
              { icon: '🏊', name: 'Swimming Pool' },
              { icon: '🧘', name: 'Spa & Wellness' },
              { icon: '🍽️', name: 'Fine Dining' },
              { icon: '🚗', name: 'Free Parking' },
              { icon: '📶', name: 'High-Speed WiFi' },
              { icon: '🏋️', name: 'Fitness Center' },
              { icon: '🚁', name: 'Airport Transfer' },
              { icon: '👶', name: 'Kids Club' },
            ].map((a) => (
              <div key={a.name} style={s.amenItem}>
                <span style={s.amenIcon}>{a.icon}</span>
                <span style={s.amenName}>{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={s.ctaSection}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Ready to Book Your Stay?</h2>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem', fontSize: '1.05rem' }}>
            Create an account to book rooms, manage reservations, and access exclusive member rates.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-accent btn-lg">Create Account</Link>
            <Link to="/rooms"    className="btn btn-outline btn-lg">Browse Rooms</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

const s = {
  hero: {
    position: 'relative', height: '92vh', minHeight: '600px', maxHeight: '900px',
    background: 'linear-gradient(135deg, #1a3c5e 0%, #2d5a8e 50%, #0f2540 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: 'url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1400&q=80") center/cover no-repeat',
    opacity: 0.18,
  },
  heroContent: {
    position: 'relative', zIndex: 1, textAlign: 'center',
    padding: '0 1.5rem', maxWidth: '900px', width: '100%',
  },
  heroBadge: {
    display: 'inline-block', background: 'rgba(201,168,76,0.2)', border: '1px solid #c9a84c',
    color: '#c9a84c', padding: '0.4rem 1.2rem', borderRadius: '30px',
    fontSize: '0.85rem', letterSpacing: '0.08em', marginBottom: '1.25rem',
  },
  heroH1: { color: '#fff', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '700', marginBottom: '1rem', lineHeight: 1.2 },
  heroSub:{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '2.5rem' },
  searchCard: {
    background: 'rgba(255,255,255,0.97)', borderRadius: '12px', padding: '1.25rem 1.5rem',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)',
  },
  searchRow: { display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' },
  searchField: { flex: 1, minWidth: '150px' },
  searchLabel: { display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#1a3c5e', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
  searchInput: { width: '100%', padding: '0.6rem 0.85rem', border: '1.5px solid #dee2e6', borderRadius: '6px', fontSize: '0.93rem', color: '#212529', background: '#fff' },
  searchBtn: { background: '#c9a84c', color: '#1a3c5e', border: 'none', padding: '0.65rem 1.75rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.93rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s' },
  statsBar: { background: '#fff', borderBottom: '1px solid #dee2e6', padding: '1.25rem 0' },
  statsRow: { display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem' },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' },
  statIcon: { fontSize: '1.5rem' },
  statValue:{ fontSize: '1.75rem', fontWeight: '700', color: '#1a3c5e' },
  statLabel:{ fontSize: '0.78rem', color: '#6c757d', textAlign: 'center' },
  section:   { padding: '4rem 0' },
  noRooms:   { textAlign: 'center', padding: '3rem', color: '#6c757d', background: '#f8f9fa', borderRadius: '12px' },
  amenSection:{ background: '#1a3c5e', padding: '4rem 0' },
  amenGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1.5rem', marginTop: '1rem' },
  amenItem:  { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', transition: 'background 0.2s' },
  amenIcon:  { fontSize: '2rem' },
  amenName:  { color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', textAlign: 'center' },
  ctaSection:{ padding: '5rem 0', background: '#f8f9fa' },
}
