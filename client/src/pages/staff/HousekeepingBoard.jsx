import DemoBanner from '../../components/common/DemoBanner'

const DEMO_TASKS = [
  { id: 1, room: '101', floor: 1, type: 'Standard Double', task: 'standard_clean', status: 'pending',     priority: 'high',   assignedTo: 'Fatima A.' },
  { id: 2, room: '202', floor: 2, type: 'Deluxe King',     task: 'standard_clean', status: 'in_progress', priority: 'normal', assignedTo: 'Biruk T.' },
  { id: 3, room: '301', floor: 3, type: 'Executive Suite', task: 'deep_clean',     status: 'clean',        priority: 'normal', assignedTo: 'Meron G.' },
  { id: 4, room: '102', floor: 1, type: 'Standard Double', task: 'turndown',        status: 'pending',      priority: 'low',    assignedTo: 'Unassigned' },
  { id: 5, room: '203', floor: 2, type: 'Deluxe King',     task: 'inspected',       status: 'inspected',    priority: 'normal', assignedTo: 'Hana B.' },
]

const STATUS_COLORS = {
  pending:     { bg: '#fef3c7', color: '#92400e' },
  in_progress: { bg: '#e0f2fe', color: '#075985' },
  clean:       { bg: '#d1fae5', color: '#065f46' },
  inspected:   { bg: '#ede9fe', color: '#4c1d95' },
}

const PRIORITY_BADGE = { high: 'badge-error', normal: 'badge-info', low: 'badge-neutral' }

export default function HousekeepingBoard() {
  const counts = DEMO_TASKS.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc }, {})

  return (
    <div>
      <h2 style={s.h2}>Housekeeping Board</h2>
      <p style={s.sub}>Room cleaning tasks and status tracking</p>

      <DemoBanner message="Housekeeping management requires Module 8. Demo tasks are shown below." />

      {/* Status summary */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {[['pending', 'Pending', '⏳'], ['in_progress', 'In Progress', '🧹'], ['clean', 'Clean', '✅'], ['inspected', 'Inspected', '🔍']].map(([status, label, icon]) => (
          <div key={status} className="stat-card" style={{ background: STATUS_COLORS[status]?.bg || '#f8f9fa' }}>
            <div style={{ fontSize: '1.5rem' }}>{icon}</div>
            <div className="stat-value" style={{ color: STATUS_COLORS[status]?.color || '#1a3c5e' }}>{counts[status] || 0}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={s.section}>
        <div style={s.sectionHead}>
          <h3 style={s.sectionH}>Today&apos;s Tasks</h3>
          <button className="btn btn-sm btn-primary" onClick={() => alert('Create task — Module 8')}>+ New Task</button>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Room</th><th>Floor</th><th>Type</th><th>Task</th><th>Priority</th><th>Assigned To</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {DEMO_TASKS.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.room}</strong></td>
                  <td>{t.floor}</td>
                  <td style={{ fontSize: '0.85rem' }}>{t.type}</td>
                  <td style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{t.task.replace('_', ' ')}</td>
                  <td><span className={`badge ${PRIORITY_BADGE[t.priority]}`}>{t.priority}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>{t.assignedTo}</td>
                  <td>
                    <span style={{ ...s.statusBadge, background: STATUS_COLORS[t.status]?.bg, color: STATUS_COLORS[t.status]?.color }}>
                      {t.status.replace('_', ' ')}
                    </span>
                    <span className="badge badge-demo" style={{ marginLeft: '0.4rem' }}>DEMO</span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => alert('Update status — Module 8')}>Update</button>
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
  section:    { background: '#fff', border: '1px solid #dee2e6', borderRadius: '12px', padding: '1.25rem', overflow: 'hidden' },
  sectionHead:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sectionH:   { fontSize: '1rem', fontWeight: '600', color: '#1a3c5e' },
  statusBadge:{ display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize' },
}
