import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import DemoBanner from '../../components/common/DemoBanner'
import { DEMO_ARRIVALS } from '../../api/bookings.api'

const ROOM_DATA = [
  { name: 'Available', value: 2, color: '#c9a84c' },
  { name: 'Occupied',  value: 6, color: '#0f1c2e' },
  { name: 'Dirty',     value: 1, color: '#d97706' },
  { name: 'Maintenance',value:1, color: '#0284c7' },
]
const SB = { confirmed:'badge-success', checked_in:'badge-info', pending:'badge-warning' }

export default function StaffOverview() {
  return (
    <div>
      <div className="dash-header">
        <h2>Hotel Overview</h2>
        <p>Today — {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
      </div>

      <DemoBanner module="Module 5 — Bookings" message="Occupancy statistics and today arrivals will use live data when Module 5 is complete." />

      <div className="grid-4" style={{marginBottom:'1.75rem'}}>
        {[{label:'Occupied Rooms',value:'6',icon:'🛏️',sub:'73% occupancy'},{label:"Today's Arrivals",value:'3',icon:'✈️',sub:'2 checked in'},{label:"Today's Departures",value:'2',icon:'🚪',sub:'0 checked out'},{label:'Available Rooms',value:'2',icon:'✅',sub:'As of now'}].map(s=>(
          <div key={s.label} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-change">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:'1.5rem',marginBottom:'1.5rem'}}>
        <div className="lux-panel">
          <div className="lux-panel-header"><h3>Today Arrivals &amp; Departures</h3><Link to="/staff/reception" style={{fontSize:'.85rem',color:'#c9a84c'}}>See all →</Link></div>
          <div className="table-container">
            <table>
              <thead><tr><th>Ref</th><th>Guest</th><th>Room</th><th>Type</th><th>Check In</th><th>Status</th><th>Payment</th><th>Action</th></tr></thead>
              <tbody>{DEMO_ARRIVALS.map(b=>(
                <tr key={b._id}>
                  <td style={{fontFamily:'monospace',fontSize:'.82rem'}}>{b.bookingRef}</td>
                  <td>{b.guest}</td><td><strong>{b.room}</strong></td><td style={{fontSize:'.85rem'}}>{b.roomType}</td><td style={{fontSize:'.85rem'}}>{b.checkIn}</td>
                  <td><span className={'badge '+(SB[b.status]||'badge-neutral')}>{b.status.replace('_',' ')}</span><span className="badge badge-demo" style={{marginLeft:4}}>DEMO</span></td>
                  <td><span className={'badge '+(b.paymentStatus==='paid'?'badge-success':'badge-warning')}>{b.paymentStatus}</span></td>
                  <td>{b.status==='confirmed'&&<button className="btn btn-navy btn-sm" onClick={()=>alert('Check-in — Module 5')}>Check In</button>}{b.status==='checked_in'&&<button className="btn btn-ghost btn-sm" onClick={()=>alert('Check-out — Module 5')}>Check Out</button>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-title">Room Status Distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={ROOM_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                {ROOM_DATA.map((e,i)=><Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v,n)=>[v+' rooms',n]} />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{textAlign:'center',marginTop:'.5rem'}}><span className="badge badge-demo">DEMO DATA</span></div>
        </div>
      </div>

      <div className="lux-panel">
        <div className="lux-panel-header"><h3>Quick Actions</h3></div>
        <div className="lux-panel-body">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'1rem'}}>
            {[{icon:'🛎️',label:'Walk-in Booking',desc:'Create booking for walk-in',act:'Walk-in booking — Module 5'},{icon:'🔑',label:'Check In Guest',desc:'Check in arriving guest',act:'Check-in — Module 5'},{icon:'🧾',label:'Generate Invoice',desc:'Create invoice at checkout',act:'Invoice — Module 7'},{icon:'🧹',label:'Assign Cleaning',desc:'Assign housekeeping task',act:'Housekeeping — Module 8'}].map(a=>(
              <button key={a.label} className="quick-action" onClick={()=>alert(a.act)}>
                <span className="quick-action-icon">{a.icon}</span>
                <strong className="quick-action-label">{a.label}</strong>
                <span className="quick-action-desc">{a.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}