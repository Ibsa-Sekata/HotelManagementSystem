import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { roomTypesApi } from '../../api/rooms.api'
import { useAuth } from '../../context/AuthContext'
import DemoBanner from '../../components/common/DemoBanner'

const formatETB = (n) =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(n)

export default function RoomDetailPage() {
  const { id }   = useParams()
  const [sp]     = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [room,    setRoom]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [imgIdx,  setImgIdx]  = useState(0)

  const [booking, setBooking] = useState({
    checkIn:  sp.get('checkIn')  || '',
    checkOut: sp.get('checkOut') || '',
    adults:   2,
    children: 0,
  })

  useEffect(() => {
    roomTypesApi.getOne(id)
      .then(({ data }) => setRoom(data.data))
      .catch(() => setError('Room not found.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>
  if (error)   return <div className="container" style={{ padding: '3rem 0' }}><div className="alert alert-error">{error}</div></div>
  if (!room)   return null

  const images = room.images?.length ? room.images : [{ url: room.thumbnailUrl, _id: 'placeholder' }]
  const nights  = booking.checkIn && booking.checkOut
    ? Math.max(0, Math.round((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000))
    : 0
  const subtotal = nights * room.basePrice
  const tax      = subtotal * 0.15
  const total    = subtotal + tax

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/rooms/${id}` } })
      return
    }
    // Module 5 not yet built — show demo notice
    alert('⚠️ Booking module (Module 5) is not yet implemented.\n\nWhen Module 5 is complete, clicking "Book Now" will create a real reservation.\n\nFor now this is a demonstration.')
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      {/* Hero image */}
      <div style={s.heroImg}>
        <img src={images[imgIdx]?.url || ''} alt={room.name}
          style={s.mainImg}
          onError={(e) => { e.target.src = `https://placehold.co/1200x500/1a3c5e/ffffff?text=${encodeURIComponent(room.name)}` }} />
        <div style={s.heroBreadcrumb}>
          <Link to="/" style={s.breadLink}>Home</Link> /
          <Link to="/rooms" style={s.breadLink}> Rooms</Link> /
          <span style={{ color: '#c9a84c' }}> {room.name}</span>
        </div>
        {images.length > 1 && (
          <div style={s.thumbRow}>
            {images.map((img, i) => (
              <img key={img._id} src={img.url} alt={`${room.name} ${i + 1}`}
                style={{ ...s.thumb, outline: i === imgIdx ? '3px solid #c9a84c' : 'none' }}
                onClick={() => setImgIdx(i)} />
            ))}
          </div>
        )}
      </div>

      <div className="container" style={s.layout}>
        {/* Left: details */}
        <div>
          <div style={s.titleRow}>
            <div>
              <h1 style={s.h1}>{room.name}</h1>
              {room.bedConfiguration && <span style={s.badge}>{room.bedConfiguration}</span>}
              {room.sizeSqm && <span style={s.badge}>{room.sizeSqm} m²</span>}
            </div>
            <div style={s.priceBlock}>
              <span style={s.priceFrom}>From</span>
              <span style={s.price}>{formatETB(room.basePrice)}</span>
              <span style={s.perNight}>/night</span>
            </div>
          </div>

          <p style={s.desc}>{room.description}</p>

          {room.amenities?.length > 0 && (
            <div style={s.amenSection}>
              <h3 style={s.sectionH}>Room Amenities</h3>
              <div style={s.amenGrid}>
                {room.amenities.map((a) => (
                  <div key={a} style={s.amenItem}><span style={s.amenDot}>✓</span> {a}</div>
                ))}
              </div>
            </div>
          )}

          {room.minStay > 1 && (
            <div className="alert alert-info">
              Minimum stay: <strong>{room.minStay} nights</strong>
            </div>
          )}

          {/* Policies */}
          <div style={s.policies}>
            <h3 style={s.sectionH}>Hotel Policies</h3>
            <div className="grid-2">
              {[
                ['🕑 Check-in',    '14:00 (2:00 PM)'],
                ['🕙 Check-out',   '11:00 (11:00 AM)'],
                ['❌ Free cancel', '48h before arrival'],
                ['💳 Payment',    'Pay at hotel or online'],
              ].map(([k, v]) => (
                <div key={k} style={s.policyItem}>
                  <strong>{k}</strong><br /><span style={{ color: '#6c757d', fontSize: '.88rem' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: booking widget */}
        <div style={s.bookWidget}>
          <div style={s.widgetCard}>
            <div style={s.widgetHeader}>
              <span>{formatETB(room.basePrice)}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '400', color: 'rgba(255,255,255,0.75)' }}> / night</span>
            </div>

            <DemoBanner message="Booking submission requires Module 5 (Reservations). Your selection is captured; click 'Book Now' to see the status." />

            <div style={{ padding: '0 1.25rem 1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Check In</label>
                <input type="date" className="form-control" min={today}
                  value={booking.checkIn}
                  onChange={(e) => setBooking({ ...booking, checkIn: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Check Out</label>
                <input type="date" className="form-control"
                  min={booking.checkIn || today}
                  value={booking.checkOut}
                  onChange={(e) => setBooking({ ...booking, checkOut: e.target.value })} />
              </div>
              <div style={s.guestRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Adults</label>
                  <select className="form-control" value={booking.adults}
                    onChange={(e) => setBooking({ ...booking, adults: Number(e.target.value) })}>
                    {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Children</label>
                  <select className="form-control" value={booking.children}
                    onChange={(e) => setBooking({ ...booking, children: Number(e.target.value) })}>
                    {[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              {nights > 0 && (
                <div style={s.priceCalc}>
                  <div style={s.calcRow}><span>{formatETB(room.basePrice)} × {nights} night{nights > 1 ? 's' : ''}</span><span>{formatETB(subtotal)}</span></div>
                  <div style={s.calcRow}><span>Tax (15%)</span><span>{formatETB(tax)}</span></div>
                  <div style={{ ...s.calcRow, ...s.calcTotal }}><span>Total</span><span>{formatETB(total)}</span></div>
                </div>
              )}

              <button className="btn btn-accent" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
                onClick={handleBookNow}>
                {isAuthenticated ? 'Book Now' : 'Sign In to Book'}
              </button>

              {!isAuthenticated && (
                <p style={{ fontSize: '0.8rem', textAlign: 'center', color: '#6c757d', marginTop: '0.5rem' }}>
                  <Link to="/register">Create a free account</Link> to save your booking
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  heroImg:     { position: 'relative', height: '480px', background: '#1a3c5e', overflow: 'hidden' },
  mainImg:     { width: '100%', height: '100%', objectFit: 'cover' },
  heroBreadcrumb: { position: 'absolute', bottom: '60px', left: '2rem', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem' },
  breadLink:   { color: 'rgba(255,255,255,0.8)', textDecoration: 'none' },
  thumbRow:    { position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem' },
  thumb:       { width: '70px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '2px solid transparent', transition: 'outline 0.2s' },
  layout:      { display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2.5rem', padding: '2.5rem 0 4rem', alignItems: 'start' },
  titleRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' },
  h1:          { fontSize: '1.8rem', color: '#1a3c5e', marginBottom: '0.5rem' },
  badge:       { display: 'inline-block', background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', marginRight: '0.5rem' },
  priceBlock:  { textAlign: 'right' },
  priceFrom:   { display: 'block', fontSize: '0.78rem', color: '#6c757d' },
  price:       { fontSize: '2rem', fontWeight: '700', color: '#1a3c5e' },
  perNight:    { fontSize: '0.85rem', color: '#6c757d' },
  desc:        { fontSize: '1rem', color: '#495057', lineHeight: '1.7', marginBottom: '2rem' },
  amenSection: { marginBottom: '2rem' },
  sectionH:    { fontSize: '1.1rem', fontWeight: '600', color: '#1a3c5e', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #dee2e6' },
  amenGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' },
  amenItem:    { fontSize: '0.88rem', color: '#495057', display: 'flex', alignItems: 'center', gap: '0.4rem' },
  amenDot:     { color: '#198754', fontWeight: '700' },
  policies:    { marginTop: '2rem' },
  policyItem:  { background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px', padding: '0.85rem' },
  bookWidget:  { position: 'sticky', top: '80px' },
  widgetCard:  { background: '#fff', border: '1px solid #dee2e6', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' },
  widgetHeader:{ background: '#1a3c5e', color: '#fff', padding: '1.25rem', fontSize: '1.5rem', fontWeight: '700' },
  guestRow:    { display: 'flex', gap: '0.75rem' },
  priceCalc:   { background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px', padding: '0.85rem', marginTop: '1rem' },
  calcRow:     { display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '0.25rem 0', color: '#495057' },
  calcTotal:   { fontWeight: '700', color: '#1a3c5e', fontSize: '1rem', borderTop: '1px solid #dee2e6', paddingTop: '0.5rem', marginTop: '0.25rem' },
}
