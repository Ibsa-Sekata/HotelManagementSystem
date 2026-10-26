import React from 'react'
import { Link } from 'react-router-dom'
import DemoBanner from '../../components/common/DemoBanner'
import { DEMO_ARRIVALS } from '../../api/bookings.api'

const STATUS_BADGE = { confirmed: 'badge-success', checked_in: 'badge-info', pending: 'badge-warning' }

export default function StaffOverview() {
  return (
    <div>
      <h2 style={s.h2}>Hotel Overview</h2>
      <p style={s.sub}>Today — {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <DemoBanner message="Occupancy statistics and today's arrivals require Module 5 (Bookings). Live data will appear here when that module is complete." />

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Occupied Rooms', value: '6',  icon: '🛏️', change: '73% occupancy' },
          { label: "Today's Arrivals", value: '3', icon: '✈️', change: '2 checked in' },
          { label: "Today's Departures", value: '2', icon: '🚪', change: '0 checked out' },
          { label: 'Available Rooms', value: '2',  icon: '✅', change: 'As of now' },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>{stat.icon}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-change">{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Today's arrivals */}
      <div style={s.section}>
        <div style={s.sectionHead}>
          <h3 style={s.sectionH}>Today&apos;s Arrivals & Departures</h3>
          <Link to="/staff/reception" style={s.seeAll}>See all →</Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ref</th><th>Guest</th><th>Room</th><th>Type</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Payment</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ARRIVALS.map((b) => (
                <tr key={b._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{b.bookingRef}</td>
                  <td>{b.guest}</td>
                  <td><strong>{b.room}</strong></td>
                  <td style={{ fontSize: '0.85rem' }}>{b.roomType}</td>
                  <td style={{ fontSize: '0.85rem' }}>{b.checkIn}</td>
                  <td style={{ fontSize: '0.85rem' }}>{b.checkOut}</td>
                  <td><span className={`badge ${STATUS_BADGE[b.status] || 'badge-neutral'}`}>{b.status.replace('_', ' ')}</span></td>
                  <td><span className={`badge ${b.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>{b.paymentStatus}</span></td>
                  <td>
                    {b.status === 'confirmed' && (
                      <button className="btn btn-sm btn-primary" onClick={() => alert('Check-in requires Module 5')}>Check In</button>
                    )}
                    {b.status === 'checked_in' && (
                      <button className="btn btn-sm btn-outline" onClick={() => alert('Check-out requires Module 5')}>Check Out</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Room status quick view */}
      <div style={{ ...s.section, marginTop: '1.5rem' }}>
        <h3 style={s.sectionH}>Quick Actions</h3>
        <div style={s.quickGrid}>
          {[
            { icon: '🛎️', label: 'Walk-in Booking',  desc: 'Create booking for walk-in guest',  action: () => alert('Walk-in booking — Module 5') },
            { icon: '🔑', label: 'Check In Guest',    desc: 'Check in an arriving guest',         action: () => alert('Check-in — Module 5') },
            { icon: '🧾', label: 'Generate Invoice',  desc: 'Create invoice at checkout',          action: () => alert('Invoice — Module 7') },
            { icon: '🧹', label: 'Assign Cleaning',   desc: 'Assign housekeeping task',            action: () => alert('Housekeeping — Module 8') },
          ].map((a) => (
            <button key={a.label} style={s.quickCard} onClick={a.action}>
              <span style={s.quickIcon}>{a.icon}</span>
              <strong style={s.quickLabel}>{a.label}</strong>
              <span style={s.quickDesc}>{a.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  h2:        { fontSize: '1.5rem', color: '#1a3c5e', marginBottom: '0.2rem' },
  sub:       { color: '#6c757d', fontSize: '0.9rem', marginBottom: '1.5rem' },
  section:   { background: '#fff', border: '1px solid #dee2e6', borderRadius: '12px', padding: '1.25rem' },
  sectionHead:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sectionH:  { fontSize: '1rem', fontWeight: '600', color: '#1a3c5e' },
  seeAll:    { fontSize: '0.85rem', color: '#1a3c5e' },
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' },
  quickCard: { background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' },
  quickIcon: { fontSize: '2rem' },
  quickLabel:{ fontSize: '0.88rem', color: '#1a3c5e' },
  quickDesc: { fontSize: '0.75rem', color: '#6c757d' },
}
