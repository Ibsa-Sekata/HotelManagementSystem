import DemoBanner from '../../components/common/DemoBanner'

const formatETB = (n) =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(n)

const DEMO_REVENUE = [
  { month: 'May 2026',    bookings: 142, revenue: 521600, occupancy: '72%' },
  { month: 'Jun 2026',    bookings: 156, revenue: 573400, occupancy: '78%' },
  { month: 'Jul 2026',    bookings: 189, revenue: 694200, occupancy: '88%' },
  { month: 'Aug 2026',    bookings: 201, revenue: 738600, occupancy: '92%' },
  { month: 'Sep 2026',    bookings: 168, revenue: 617300, occupancy: '82%' },
  { month: 'Oct 2026',    bookings: 94,  revenue: 345200, occupancy: '73%' },
]

export default function ReportsPage() {
  const total = DEMO_REVENUE.reduce((a, r) => a + r.revenue, 0)

  return (
    <div>
      <h2 style={s.h2}>Reports & Analytics</h2>
      <p style={s.sub}>Occupancy, revenue, and booking statistics</p>

      <DemoBanner message="Live reports require Module 9. The charts below use demo data to illustrate the reporting layout." />

      {/* KPI row */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'YTD Revenue',     value: formatETB(total),  icon: '💰', change: '+12% vs last year' },
          { label: 'Total Bookings',  value: '950',              icon: '📋', change: 'Last 6 months' },
          { label: 'Avg Occupancy',   value: '81%',              icon: '🏨', change: 'Last 6 months' },
          { label: 'Avg Stay Length', value: '2.4 nights',       icon: '📅', change: 'Last 6 months' },
        ].map((k) => (
          <div key={k.label} className="stat-card">
            <div style={{ fontSize: '1.5rem' }}>{k.icon}</div>
            <div className="stat-label">{k.label}</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{k.value}</div>
            <div className="stat-change">{k.change}</div>
          </div>
        ))}
      </div>

      {/* Revenue table */}
      <div style={s.section}>
        <div style={s.sectionHead}>
          <h3 style={s.sectionH}>Monthly Revenue Summary</h3>
          <span className="badge badge-demo">DEMO DATA</span>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Month</th><th>Bookings</th><th>Revenue (ETB)</th><th>Occupancy</th><th>Avg/Booking</th><th>Bar</th></tr></thead>
            <tbody>
              {DEMO_REVENUE.map((r) => {
                const maxRev = Math.max(...DEMO_REVENUE.map(x => x.revenue))
                const pct = (r.revenue / maxRev) * 100
                return (
                  <tr key={r.month}>
                    <td>{r.month}</td>
                    <td>{r.bookings}</td>
                    <td><strong>{formatETB(r.revenue)}</strong></td>
                    <td>{r.occupancy}</td>
                    <td style={{ color: '#6c757d', fontSize: '0.85rem' }}>{formatETB(Math.round(r.revenue / r.bookings))}</td>
                    <td style={{ width: '180px' }}>
                      <div style={{ background: '#e0f2fe', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#1a3c5e', borderRadius: '4px' }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Room type performance */}
      <div style={{ ...s.section, marginTop: '1.5rem' }}>
        <div style={s.sectionHead}>
          <h3 style={s.sectionH}>Room Type Performance (Last 30 days)</h3>
          <span className="badge badge-demo">DEMO DATA</span>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Room Type</th><th>Bookings</th><th>Revenue</th><th>Avg Rate</th><th>Occupancy</th></tr></thead>
            <tbody>
              {[
                { type: 'Standard Double',  bookings: 42, revenue: 105000, rate: 2500, occ: '87%' },
                { type: 'Deluxe King',      bookings: 31, revenue: 130200, rate: 4200, occ: '79%' },
                { type: 'Executive Suite',  bookings: 9,  revenue: 76500,  rate: 8500, occ: '61%' },
              ].map((r) => (
                <tr key={r.type}>
                  <td><strong>{r.type}</strong></td>
                  <td>{r.bookings}</td>
                  <td>{formatETB(r.revenue)}</td>
                  <td style={{ color: '#6c757d' }}>{formatETB(r.rate)}/night</td>
                  <td><span className="badge badge-info">{r.occ}</span></td>
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
  section:    { background: '#fff', border: '1px solid #dee2e6', borderRadius: '12px', padding: '1.25rem', overflow: 'hidden' },
  sectionHead:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sectionH:   { fontSize: '1rem', fontWeight: '600', color: '#1a3c5e' },
}
