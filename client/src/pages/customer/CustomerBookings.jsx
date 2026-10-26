import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { bookingsApi, invoicesApi } from '../../api/bookings.api'

const formatETB = (n) =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(n)

const STATUS_BADGE = {
  confirmed:   'badge-success',
  checked_in:  'badge-info',
  checked_out: 'badge-neutral',
  cancelled:   'badge-error',
  no_show:     'badge-warning',
}

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [cancelling, setCancelling] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await bookingsApi.getMine()
      setBookings(data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load bookings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    const fetchData = async () => {
      try {
        const { data } = await bookingsApi.getMine()
        if (!ignore) {
          setBookings(data.data)
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || 'Could not load bookings')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }
    fetchData()
    return () => { ignore = true }
  }, [])

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    setCancelling(id)
    try {
      await bookingsApi.cancel(id)
      await load()
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed')
    } finally {
      setCancelling(null)
    }
  }

  const handleInvoice = async (id) => {
    try {
      const { data } = await invoicesApi.generate(id)
      alert(`Invoice generated!\nInvoice total: ${formatETB(data.data.totalDue)}\nHotel: ${data.hotel.name}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Could not generate invoice')
    }
  }

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>

  return (
    <div>
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.h2}>My Bookings</h2>
          <p style={s.subtitle}>View and manage your reservations</p>
        </div>
        <Link to="/rooms" className="btn btn-accent btn-sm">+ New Booking</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && bookings.length === 0 && (
        <div style={s.empty}>
          <span style={{ fontSize: '3rem' }}>📋</span>
          <h3>No bookings yet</h3>
          <p>Your reservations will appear here once you make a booking.</p>
          <Link to="/rooms" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Rooms</Link>
        </div>
      )}

      {bookings.length > 0 && (
        <div style={s.list}>
          {bookings.map((b) => (
            <div key={b._id} style={s.bookingCard}>
              <div style={s.bookingHeader}>
                <div>
                  <span style={s.ref}>{b.bookingRef}</span>
                  <span className={`badge ${STATUS_BADGE[b.status] || 'badge-neutral'}`} style={{ marginLeft: '0.75rem' }}>
                    {b.status.replace('_', ' ')}
                  </span>
                </div>
                <span style={s.total}>{formatETB(b.totalPrice)}</span>
              </div>

              <div style={s.bookingBody}>
                <div style={s.roomInfo}>
                  <strong>{b.roomType?.name || 'Room'}</strong>
                  {b.room?.roomNumber && <span style={s.roomNum}>Room {b.room.roomNumber}</span>}
                </div>
                <div style={s.dates}>
                  <div style={s.dateItem}>
                    <span style={s.dateLabel}>Check In</span>
                    <span style={s.dateVal}>{new Date(b.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div style={s.dateArrow}>→</div>
                  <div style={s.dateItem}>
                    <span style={s.dateLabel}>Check Out</span>
                    <span style={s.dateVal}>{new Date(b.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div style={s.dateItem}>
                    <span style={s.dateLabel}>Duration</span>
                    <span style={s.dateVal}>{b.nights} night{b.nights > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              <div style={s.bookingFooter}>
                <span style={{ fontSize: '0.82rem', color: '#6c757d' }}>
                  {b.adults} adult{b.adults > 1 ? 's' : ''}
                  {b.children > 0 ? ` · ${b.children} child${b.children > 1 ? 'ren' : ''}` : ''}
                  {' · '}Payment: <strong>{b.paymentStatus}</strong>
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(b.status === 'checked_out' || b.status === 'confirmed' || b.status === 'checked_in') && (
                    <button className="btn btn-sm btn-outline" onClick={() => handleInvoice(b._id)}>
                      🧾 Invoice
                    </button>
                  )}
                  {b.status === 'confirmed' && (
                    <button
                      className="btn btn-sm"
                      style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
                      onClick={() => handleCancel(b._id)}
                      disabled={cancelling === b._id}
                    >
                      {cancelling === b._id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  pageHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  h2:           { fontSize: '1.5rem', color: '#1a3c5e', marginBottom: '0.2rem' },
  subtitle:     { color: '#6c757d', fontSize: '0.9rem' },
  empty:        { textAlign: 'center', padding: '4rem 2rem', color: '#6c757d', background: '#f8f9fa', borderRadius: '12px' },
  list:         { display: 'flex', flexDirection: 'column', gap: '1rem' },
  bookingCard:  { background: '#fff', border: '1px solid #dee2e6', borderRadius: '12px', overflow: 'hidden' },
  bookingHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #dee2e6', background: '#f8f9fa' },
  ref:          { fontFamily: 'monospace', fontWeight: '600', color: '#1a3c5e', fontSize: '0.9rem' },
  total:        { fontWeight: '700', color: '#1a3c5e', fontSize: '1.1rem' },
  bookingBody:  { padding: '1rem 1.25rem' },
  roomInfo:     { marginBottom: '0.75rem' },
  roomNum:      { marginLeft: '0.75rem', color: '#6c757d', fontSize: '0.88rem' },
  dates:        { display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' },
  dateItem:     { display: 'flex', flexDirection: 'column', gap: '0.15rem' },
  dateLabel:    { fontSize: '0.72rem', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.05em' },
  dateVal:      { fontSize: '0.93rem', fontWeight: '500', color: '#212529' },
  dateArrow:    { color: '#dee2e6', fontSize: '1.2rem' },
  bookingFooter:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', borderTop: '1px solid #dee2e6', background: '#fafafa' },
}
