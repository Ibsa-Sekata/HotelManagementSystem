import { Link } from 'react-router-dom'

const formatETB = (n) =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(n)

export default function RoomCard({ room, checkIn, checkOut }) {
  const img = room.thumbnailUrl ||
    room.images?.[0]?.url ||
    `https://placehold.co/600x400/1a3c5e/ffffff?text=${encodeURIComponent(room.name)}`

  const searchParams = new URLSearchParams()
  if (checkIn)  searchParams.set('checkIn', checkIn)
  if (checkOut) searchParams.set('checkOut', checkOut)
  const linkTo = `/rooms/${room._id}${searchParams.toString() ? '?' + searchParams.toString() : ''}`

  return (
    <div className="card" style={s.card}>
      <div style={s.imgWrap}>
        <img src={img} alt={room.name} style={s.img} loading="lazy"
          onError={(e) => { e.target.src = `https://placehold.co/600x400/1a3c5e/ffffff?text=${encodeURIComponent(room.name)}` }} />
        {room.availableRooms != null && (
          <span style={s.badge}>
            {room.availableRooms} available
          </span>
        )}
      </div>

      <div className="card-body">
        <div style={s.typeRow}>
          {room.bedConfiguration && <span style={s.bedConf}>{room.bedConfiguration}</span>}
          {room.sizeSqm && <span style={s.size}>{room.sizeSqm} m²</span>}
        </div>

        <h3 style={s.name}>{room.name}</h3>
        <p style={s.desc}>{room.description?.slice(0, 110)}{room.description?.length > 110 ? '…' : ''}</p>

        {room.amenities?.length > 0 && (
          <div style={s.amenities}>
            {room.amenities.slice(0, 4).map((a) => (
              <span key={a} style={s.amenity}>{a}</span>
            ))}
            {room.amenities.length > 4 && (
              <span style={s.amenity}>+{room.amenities.length - 4} more</span>
            )}
          </div>
        )}

        <div style={s.footer}>
          <div>
            <span style={s.priceLabel}>From</span>
            <span style={s.price}>{formatETB(room.basePrice)}</span>
            <span style={s.perNight}> / night</span>
          </div>
          <Link to={linkTo} style={s.btn}>View Room</Link>
        </div>
      </div>
    </div>
  )
}

const s = {
  card:      { display: 'flex', flexDirection: 'column', height: '100%', transition: 'transform 0.2s, box-shadow 0.2s' },
  imgWrap:   { position: 'relative', height: '220px', overflow: 'hidden', flexShrink: 0 },
  img:       { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' },
  badge:     { position: 'absolute', top: '12px', right: '12px', background: 'rgba(25,135,84,0.9)', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' },
  typeRow:   { display: 'flex', gap: '0.6rem', marginBottom: '0.4rem' },
  bedConf:   { fontSize: '0.78rem', color: '#6c757d', background: '#f1f5f9', padding: '2px 8px', borderRadius: '20px' },
  size:      { fontSize: '0.78rem', color: '#6c757d', background: '#f1f5f9', padding: '2px 8px', borderRadius: '20px' },
  name:      { fontSize: '1.15rem', fontWeight: '600', color: '#1a3c5e', marginBottom: '0.4rem' },
  desc:      { fontSize: '0.85rem', color: '#6c757d', lineHeight: '1.5', marginBottom: '0.75rem', flexGrow: 1 },
  amenities: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' },
  amenity:   { fontSize: '0.72rem', background: '#e0f2fe', color: '#075985', padding: '3px 8px', borderRadius: '20px' },
  footer:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #dee2e6', marginTop: 'auto' },
  priceLabel:{ fontSize: '0.75rem', color: '#6c757d', display: 'block' },
  price:     { fontSize: '1.3rem', fontWeight: '700', color: '#1a3c5e' },
  perNight:  { fontSize: '0.78rem', color: '#6c757d' },
  btn:       { background: '#1a3c5e', color: '#fff', padding: '0.5rem 1.1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none', transition: 'background 0.2s' },
}
