import DemoBanner from '../../components/common/DemoBanner'
import { DEMO_ARRIVALS } from '../../api/bookings.api'

const STATUS_BADGE = { confirmed: 'badge-success', checked_in: 'badge-info', pending: 'badge-warning' }

export default function ReceptionDesk() {
  return (
    <div>
      <h2 style={s.h2}>Reception Desk</h2>
      <p style={s.sub}>Manage guest arrivals, departures, and walk-in bookings</p>

      <DemoBanner message="Check-in, check-out, and walk-in bookings require Module 5 (Reservations) and Module 6 (Staff Booking). Demo data shown below." />

      <div style={s.actionsBar}>
        <button className="btn btn-primary" onClick={() => alert('Walk-in booking — Module 5 + 6')}>+ Walk-In Booking</button>
        <button className="btn btn-outline" onClick={() => alert('Search booking by reference — Module 5')}>🔍 Find Booking</button>
      </div>

      <div style={s.section}>
        <h3 style={s.sectionH}>Today&apos;s Guest List</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Ref</th><th>Guest</th><th>Room</th><th>Room Type</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Payment</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {DEMO_ARRIVALS.map((b) => (
                <tr key={b._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{b.bookingRef}</td>
                  <td><strong>{b.guest}</strong></td>
                  <td><strong>{b.room}</strong></td>
                  <td style={{ fontSize: '0.85rem' }}>{b.roomType}</td>
                  <td style={{ fontSize: '0.85rem' }}>{b.checkIn}</td>
                  <td style={{ fontSize: '0.85rem' }}>{b.checkOut}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[b.status] || 'badge-neutral'}`}>{b.status.replace('_', ' ')}</span>
                    <span className="badge badge-demo" style={{ marginLeft: '0.4rem' }}>DEMO</span>
                  </td>
                  <td><span className={`badge ${b.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>{b.paymentStatus}</span></td>
                  <td style={{ display: 'flex', gap: '0.4rem' }}>
                    {b.status === 'confirmed' && <button className="btn btn-sm btn-primary" onClick={() => alert('Check-in — Module 5')}>Check In</button>}
                    {b.status === 'checked_in' && <button className="btn btn-sm btn-outline" onClick={() => alert('Check-out — Module 5')}>Check Out</button>}
                    <button className="btn btn-sm" style={{ background: '#f8f9fa', border: '1px solid #dee2e6', color: '#495057' }} onClick={() => alert('View booking details — Module 5')}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const s = {
  h2:         { fontSize: '1.5rem', color: '#1a3c5e', marginBottom: '0.2rem' },
  sub:        { color: '#6c757d', fontSize: '0.9rem', marginBottom: '1.5rem' },
  actionsBar: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' },
  section:    { background: '#fff', border: '1px solid #dee2e6', borderRadius: '12px', padding: '1.25rem', overflow: 'hidden' },
  sectionH:   { fontSize: '1rem', fontWeight: '600', color: '#1a3c5e', marginBottom: '1rem' },
}
