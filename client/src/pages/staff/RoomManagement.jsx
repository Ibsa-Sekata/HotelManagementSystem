import { useState, useEffect } from 'react'
import { roomTypesApi, roomsApi } from '../../api/rooms.api'

const formatETB = (n) =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(n)

const STATUS_COLORS = {
  available:   '#d1fae5',
  occupied:    '#fee2e2',
  dirty:       '#fef3c7',
  maintenance: '#e0f2fe',
  out_of_order:'#f1f5f9',
}

export default function RoomManagement() {
  const [tab,        setTab]        = useState('types') // 'types' | 'rooms'
  const [roomTypes,  setRoomTypes]  = useState([])
  const [rooms,      setRooms]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [typesRes, roomsRes] = await Promise.all([
          roomTypesApi.getAll({ all: 'true' }),
          roomsApi.getAll(),
        ])
        setRoomTypes(typesRes.data.data)
        setRooms(roomsRes.data.data)
      } catch (e) {
        setError('Failed to load room data: ' + (e.response?.data?.message || e.message))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>
  if (error)   return <div className="alert alert-error">{error}</div>

  return (
    <div>
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.h2}>Room Management</h2>
          <p style={s.sub}>Manage room types and individual rooms — <strong>live data from the database</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={() => alert('Create room type — form UI coming in Module 4')}>+ Room Type</button>
          <button className="btn btn-primary btn-sm" onClick={() => alert('Create room — form UI coming in Module 4')}>+ Room</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(tab === 'types' ? s.tabActive : {}) }} onClick={() => setTab('types')}>
          Room Types ({roomTypes.length})
        </button>
        <button style={{ ...s.tab, ...(tab === 'rooms' ? s.tabActive : {}) }} onClick={() => setTab('rooms')}>
          Individual Rooms ({rooms.length})
        </button>
      </div>

      {tab === 'types' && (
        <div style={s.section}>
          {roomTypes.length === 0 ? (
            <p style={{ color: '#6c757d', textAlign: 'center', padding: '2rem' }}>No room types found. Run the seed script or create one.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Name</th><th>Base Price</th><th>Capacity</th><th>Min Stay</th><th>Images</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {roomTypes.map((rt) => (
                    <tr key={rt._id}>
                      <td><strong>{rt.name}</strong><br /><span style={{ fontSize: '0.78rem', color: '#6c757d' }}>{rt.bedConfiguration}</span></td>
                      <td>{formatETB(rt.basePrice)}<span style={{ fontSize: '0.75rem', color: '#6c757d' }}>/night</span></td>
                      <td>{rt.capacity} guests</td>
                      <td>{rt.minStay} night{rt.minStay > 1 ? 's' : ''}</td>
                      <td>{rt.images?.length || 0} photo{rt.images?.length !== 1 ? 's' : ''}</td>
                      <td>
                        <span className={`badge ${rt.isActive ? 'badge-success' : 'badge-neutral'}`}>
                          {rt.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => alert(`Edit ${rt.name} — detailed form UI coming`)}>Edit</button>
                        <button className="btn btn-sm" style={{ background: rt.isActive ? '#fee2e2' : '#d1fae5', color: rt.isActive ? '#991b1b' : '#065f46', border: '1px solid currentColor' }}
                          onClick={() => alert(`${rt.isActive ? 'Deactivate' : 'Activate'} requires staff auth token`)}>
                          {rt.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'rooms' && (
        <div style={s.section}>
          {rooms.length === 0 ? (
            <p style={{ color: '#6c757d', textAlign: 'center', padding: '2rem' }}>No rooms found. Run the seed script or create rooms.</p>
          ) : (
            <>
              {/* Visual room grid */}
              <div style={s.floorGrid}>
                {[...new Set(rooms.map(r => r.floor))].sort((a,b) => b - a).map(floor => (
                  <div key={floor} style={s.floorRow}>
                    <div style={s.floorLabel}>Floor {floor}</div>
                    <div style={s.roomRow}>
                      {rooms.filter(r => r.floor === floor).map(room => (
                        <div key={room._id} style={{ ...s.roomBox, background: STATUS_COLORS[room.status] || '#f1f5f9' }}>
                          <div style={s.roomNum}>{room.roomNumber}</div>
                          <div style={s.roomStatus}>{room.status.replace('_', '\n')}</div>
                          <div style={s.roomType}>{room.roomType?.name?.split(' ')[0]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div style={s.legend}>
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <div key={status} style={s.legendItem}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: color, border: '1px solid #dee2e6' }} />
                    <span style={{ fontSize: '0.78rem', color: '#6c757d', textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="table-container" style={{ marginTop: '1.5rem' }}>
                <table>
                  <thead><tr><th>Room #</th><th>Floor</th><th>Type</th><th>Status</th><th>Active</th><th>Notes</th><th>Action</th></tr></thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr key={room._id}>
                        <td><strong>{room.roomNumber}</strong></td>
                        <td>{room.floor}</td>
                        <td style={{ fontSize: '0.85rem' }}>{room.roomType?.name || '—'}</td>
                        <td><span className="badge badge-neutral" style={{ background: STATUS_COLORS[room.status] }}>{room.status.replace('_', ' ')}</span></td>
                        <td><span className={`badge ${room.isActive ? 'badge-success' : 'badge-neutral'}`}>{room.isActive ? 'Yes' : 'No'}</span></td>
                        <td style={{ fontSize: '0.82rem', color: '#6c757d', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.notes || '—'}</td>
                        <td>
                          <button className="btn btn-sm btn-outline" onClick={() => alert(`Edit room ${room.roomNumber}`)}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const s = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  h2:         { fontSize: '1.5rem', color: '#1a3c5e', marginBottom: '0.2rem' },
  sub:        { color: '#6c757d', fontSize: '0.9rem' },
  tabs:       { display: 'flex', borderBottom: '2px solid #dee2e6', marginBottom: '1.5rem' },
  tab:        { padding: '0.6rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#6c757d', borderBottom: '3px solid transparent', marginBottom: '-2px', transition: 'all 0.2s' },
  tabActive:  { color: '#1a3c5e', borderBottomColor: '#1a3c5e', fontWeight: '600' },
  section:    { background: '#fff', border: '1px solid #dee2e6', borderRadius: '12px', padding: '1.25rem', overflow: 'hidden' },
  floorGrid:  { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' },
  floorRow:   { display: 'flex', alignItems: 'center', gap: '1rem' },
  floorLabel: { width: '60px', fontSize: '0.82rem', fontWeight: '600', color: '#6c757d', flexShrink: 0 },
  roomRow:    { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  roomBox:    { width: '72px', height: '72px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.1)', cursor: 'default', gap: '2px' },
  roomNum:    { fontWeight: '700', fontSize: '0.88rem', color: '#1a3c5e' },
  roomStatus: { fontSize: '0.62rem', color: '#6c757d', textAlign: 'center', whiteSpace: 'pre-line', textTransform: 'capitalize' },
  roomType:   { fontSize: '0.62rem', color: '#6c757d' },
  legend:     { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
}
