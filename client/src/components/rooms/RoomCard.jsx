import { Link } from "react-router-dom"
const f = n => new Intl.NumberFormat("en-ET",{style:"currency",currency:"ETB",maximumFractionDigits:0}).format(n)
export default function RoomCard({ room, checkIn, checkOut }) {
  const img = room.thumbnailUrl||room.images?.[0]?.url||`https://placehold.co/800x500/0f1c2e/c9a84c?text=${encodeURIComponent(room.name)}`
  const sp=new URLSearchParams(); if(checkIn)sp.set("checkIn",checkIn); if(checkOut)sp.set("checkOut",checkOut)
  const to=`/rooms/${room._id}${sp.toString()?"?"+sp.toString():""}`
  return (
    <div className="room-card">
      <div className="room-card-img-wrap">
        <img src={img} alt={room.name} loading="lazy" onError={e=>{e.target.src=`https://placehold.co/800x500/0f1c2e/c9a84c?text=Grand+Horizon`}} />
        {room.availableRooms!=null&&<span style={{position:"absolute",top:12,right:12,background:"rgba(25,135,84,.9)",color:"#fff",padding:"4px 10px",borderRadius:20,fontSize:".75rem",fontWeight:700}}>{room.availableRooms} available</span>}
      </div>
      <div style={{padding:"1.25rem",display:"flex",flexDirection:"column",flex:1}}>
        <div style={{display:"flex",gap:".5rem",marginBottom:".5rem",flexWrap:"wrap"}}>
          {room.bedConfiguration&&<span style={{fontSize:".72rem",background:"#f1f5f9",color:"#475569",padding:"2px 8px",borderRadius:20}}>{room.bedConfiguration}</span>}
          {room.sizeSqm&&<span style={{fontSize:".72rem",background:"#f1f5f9",color:"#475569",padding:"2px 8px",borderRadius:20}}>{room.sizeSqm} m²</span>}
        </div>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.15rem",fontWeight:700,color:"#0f1c2e",marginBottom:".4rem"}}>{room.name}</h3>
        <p style={{fontSize:".84rem",color:"#718096",lineHeight:1.5,marginBottom:".85rem",flex:1,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{room.description}</p>
        {room.amenities?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:".35rem",marginBottom:".9rem"}}>{room.amenities.slice(0,4).map(a=><span key={a} style={{fontSize:".7rem",background:"#e0f2fe",color:"#075985",padding:"2px 7px",borderRadius:20}}>{a}</span>)}{room.amenities.length>4&&<span style={{fontSize:".7rem",background:"#f1f5f9",color:"#718096",padding:"2px 7px",borderRadius:20}}>+{room.amenities.length-4}</span>}</div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:".85rem",borderTop:"1px solid #f0e8df",marginTop:"auto"}}>
          <div><span style={{fontSize:".72rem",color:"#718096",display:"block"}}>From</span><span style={{fontFamily:"'Playfair Display',serif",fontSize:"1.25rem",fontWeight:700,color:"#0f1c2e"}}>{f(room.basePrice)}</span><span style={{fontSize:".75rem",color:"#718096"}}> / night</span></div>
          <Link to={to} className="btn btn-gold btn-sm">View Room →</Link>
        </div>
      </div>
    </div>
  )
}
