import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { roomsApi, roomTypesApi } from '../../api/rooms.api'
import RoomCard from '../../components/rooms/RoomCard'

export default function RoomsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { today, tomorrow } = useMemo(() => {
    const now = new Date()
    const nextDay = new Date(now.getTime() + 86400000)
    return {
      today: now.toISOString().split('T')[0],
      tomorrow: nextDay.toISOString().split('T')[0],
    }
  }, [])

  const [filters, setFilters] = useState({
    checkIn:  searchParams.get('checkIn')  || '',
    checkOut: searchParams.get('checkOut') || '',
    guests:   searchParams.get('guests')   || '',
    minPrice: '',
    maxPrice: '',
  })

  const fetchRooms = useCallback(async (f) => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (f.checkIn)  params.checkIn  = f.checkIn
      if (f.checkOut) params.checkOut = f.checkOut
      if (f.guests)   params.guests   = f.guests
      if (f.minPrice) params.minPrice = f.minPrice
      if (f.maxPrice) params.maxPrice = f.maxPrice

      // If dates provided, search for availability; otherwise list all types
      let data
      if (f.checkIn && f.checkOut) {
        const res = await roomsApi.search(params)
        data = res.data.data
      } else {
        const res = await roomTypesApi.getAll(params)
        data = res.data.data
      }
      setRooms(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load rooms. Is the server running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRooms(filters) }, []) // eslint-disable-line

  const handleSearch = (e) => {
    e.preventDefault()
    const newParams = {}
    if (filters.checkIn)  newParams.checkIn  = filters.checkIn
    if (filters.checkOut) newParams.checkOut = filters.checkOut
    if (filters.guests)   newParams.guests   = filters.guests
    setSearchParams(newParams)
    fetchRooms(filters)
  }

  const hasDateSearch = filters.checkIn && filters.checkOut

  return (
    <div style={s.page}>
      {/* Page header */}
      <div style={s.header}>
        <div className="container">
          <h1 style={s.h1}>Room Catalog</h1>
          <p style={s.subtitle}>Find the perfect room for your stay</p>
        </div>
      </div>

      <div className="container" style={s.layout}>
        {/* Filters sidebar */}
        <aside style={s.sidebar}>
          <form onSubmit={handleSearch}>
            <div style={s.filterCard}>
              <h3 style={s.filterTitle}>Search & Filter</h3>

              <div className="form-group">
                <label className="form-label">Check In</label>
                <input type="date" className="form-control" min={today}
                  value={filters.checkIn}
                  onChange={(e) => setFilters({ ...filters, checkIn: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Check Out</label>
                <input type="date" className="form-control" min={filters.checkIn || tomorrow}
                  value={filters.checkOut}
                  onChange={(e) => setFilters({ ...filters, checkOut: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Guests</label>
                <select className="form-control" value={filters.guests}
                  onChange={(e) => setFilters({ ...filters, guests: e.target.value })}>
                  <option value="">Any</option>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Min Price (ETB/night)</label>
                <input type="number" className="form-control" placeholder="0"
                  min="0" value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Max Price (ETB/night)</label>
                <input type="number" className="form-control" placeholder="Any"
                  min="0" value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {hasDateSearch ? '🔍 Check Availability' : '🔍 Search Rooms'}
              </button>

              {(filters.checkIn || filters.checkOut || filters.guests || filters.minPrice || filters.maxPrice) && (
                <button type="button" className="btn btn-outline" style={{ width: '100%', marginTop: '0.5rem' }}
                  onClick={() => { setFilters({ checkIn: '', checkOut: '', guests: '', minPrice: '', maxPrice: '' }); fetchRooms({}) }}>
                  Clear Filters
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* Results */}
        <main>
          {hasDateSearch && (
            <div style={s.searchInfo}>
              <strong>Showing availability:</strong> {filters.checkIn} → {filters.checkOut}
              {filters.guests && ` · ${filters.guests} guest${filters.guests > 1 ? 's' : ''}`}
            </div>
          )}

          {loading && <div className="spinner-container"><div className="spinner" /></div>}

          {error && <div className="alert alert-error">{error}</div>}

          {!loading && !error && rooms.length === 0 && (
            <div style={s.empty}>
              <span style={{ fontSize: '3rem' }}>🏨</span>
              <h3>No rooms found</h3>
              <p>Try adjusting your dates or filters.</p>
            </div>
          )}

          {!loading && !error && rooms.length > 0 && (
            <>
              <p style={s.resultCount}>{rooms.length} room type{rooms.length !== 1 ? 's' : ''} found</p>
              <div className="grid-2" style={s.grid}>
                {rooms.map((room) => (
                  <RoomCard key={room._id} room={room}
                    checkIn={filters.checkIn} checkOut={filters.checkOut} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

const s = {
  page:        { minHeight: '80vh' },
  header:      { background: '#1a3c5e', padding: '2.5rem 0', marginBottom: '2.5rem' },
  h1:          { color: '#fff', fontSize: '2rem', marginBottom: '0.4rem' },
  subtitle:    { color: 'rgba(255,255,255,0.75)', fontSize: '1rem' },
  layout:      { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', paddingBottom: '3rem', alignItems: 'start' },
  sidebar:     { position: 'sticky', top: '80px' },
  filterCard:  { background: '#fff', border: '1px solid #dee2e6', borderRadius: '12px', padding: '1.5rem' },
  filterTitle: { fontSize: '1rem', fontWeight: '600', color: '#1a3c5e', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #dee2e6' },
  searchInfo:  { background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.9rem', color: '#075985' },
  resultCount: { color: '#6c757d', fontSize: '0.88rem', marginBottom: '1rem' },
  grid:        { gap: '1.5rem' },
  empty:       { textAlign: 'center', padding: '4rem 2rem', color: '#6c757d', background: '#f8f9fa', borderRadius: '12px' },
}
