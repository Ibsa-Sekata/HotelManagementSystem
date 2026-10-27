import { useState, useEffect } from "react"
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom"
import { roomTypesApi } from "../../api/rooms.api"
import { useAuth } from "../../context/AuthContext"
import DemoBanner from "../../components/common/DemoBanner"

const fETB = n => new Intl.NumberFormat("en-ET",{style:"currency",currency:"ETB",maximumFractionDigits:0}).format(n)

export default function RoomDetailPage() {
  const { id } = useParams(); const [sp]=useSearchParams(); const navigate=useNavigate(); const { isAuthenticated }=useAuth()
  const [room,setRoom]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [imgIdx,setImgIdx]=useState(0)
  const [bk,setBk]=useState({ checkIn:sp.get("checkIn")||"", checkOut:sp.get("checkOut")||"", adults:2, children:0 })

  useEffect(()=>{ roomTypesApi.getOne(id).then(r=>setRoom(r.data.data)).catch(()=>setError("Room not found.")).finally(()=>setLoading(false)) },[id])

  if(loading) return <div className="spinner-container"><div className="spinner"/></div>
  if(error)   return <div className="container" style={{padding:"3rem 0"}}><div className="alert alert-error">{error}</div></div>
  if(!room)   return null

  const imgs = room.images?.length ? room.images : [{url:room.thumbnailUrl||`https://placehold.co/1200x500/0f1c2e/c9a84c?text=${encodeURIComponent(room.name)}`,_id:"ph"}]
  const nights = bk.checkIn&&bk.checkOut ? Math.max(0,Math.round((new Date(bk.checkOut)-new Date(bk.checkIn))/86400000)) : 0
  const sub=nights*room.basePrice; const tax=Math.round(sub*.15); const total=sub+tax

  const handleBook = () => { if(!isAuthenticated){ navigate("/login",{state:{from:`/rooms/${id}`}}); return }; alert("⚠️ Booking (Module 5) connects here. Use the API endpoint POST /api/v1/bookings.") }
  const today=new Date().toISOString().split("T")[0]

  return (
    <div>
      <div style={{position:"relative",height:480,overflow:"hidden",background:"#0f1c2e"}}>
        <img src={imgs[imgIdx]?.url||""} alt={room.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.src=`https://placehold.co/1200x500/0f1c2e/c9a84c?text=${encodeURIComponent(room.name)}`}} />
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(15,28,46,.7),transparent 50%)"}} />
        <div style={{position:"absolute",bottom:20,left:24,background:"rgba(15,28,46,.65)",color:"#fff",padding:"6px 14px",borderRadius:8,fontSize:".84rem",backdropFilter:"blur(4px)"}}>
          <Link to="/" style={{color:"rgba(255,255,255,.7)"}}>Home</Link> / <Link to="/rooms" style={{color:"rgba(255,255,255,.7)"}}>Rooms</Link> / <span style={{color:"#c9a84c"}}>{room.name}</span>
        </div>
        {imgs.length>1&&(
          <div style={{position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8}}>
            {imgs.map((im,i)=><img key={im._id} src={im.url} alt="" style={{width:68,height:48,objectFit:"cover",borderRadius:6,cursor:"pointer",outline:i===imgIdx?"3px solid #c9a84c":"2px solid rgba(255,255,255,.3)",opacity:i===imgIdx?1:.75,transition:"all .2s"}} onClick={()=>setImgIdx(i)} onError={e=>{e.target.style.display="none"}} />)}
          </div>
        )}
      </div>

      <div className="container" style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:"2.5rem",padding:"2.5rem 1.5rem 4rem",alignItems:"start"}}>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"1rem",marginBottom:"1.25rem"}}>
            <div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",color:"#0f1c2e",marginBottom:".5rem"}}>{room.name}</h1>
              <div style={{display:"flex",gap:".5rem",flexWrap:"wrap"}}>
                {room.bedConfiguration&&<span className="badge badge-gold">{room.bedConfiguration}</span>}
                {room.sizeSqm&&<span className="badge badge-neutral">{room.sizeSqm} m²</span>}
                {room.capacity&&<span className="badge badge-neutral">Max {room.capacity} guests</span>}
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <span style={{fontSize:".75rem",color:"#718096",display:"block"}}>From</span>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",fontWeight:700,color:"#0f1c2e"}}>{fETB(room.basePrice)}</span>
              <span style={{fontSize:".85rem",color:"#718096"}}>/night</span>
            </div>
          </div>
          <p style={{fontSize:"1rem",color:"#4a5568",lineHeight:1.75,marginBottom:"2rem"}}>{room.description}</p>
          {room.amenities?.length>0&&(
            <div style={{marginBottom:"2rem"}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:"#0f1c2e",marginBottom:"1rem",paddingBottom:".6rem",borderBottom:"1px solid #f0e8df"}}>Room Amenities</h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:".5rem"}}>
                {room.amenities.map(a=><div key={a} style={{fontSize:".88rem",color:"#4a5568",display:"flex",alignItems:"center",gap:".4rem"}}><span style={{color:"#c9a84c",fontWeight:700}}>✓</span>{a}</div>)}
              </div>
            </div>
          )}
          <div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:"#0f1c2e",marginBottom:"1rem",paddingBottom:".6rem",borderBottom:"1px solid #f0e8df"}}>Hotel Policies</h3>
            <div className="grid-2">
              {[["🕑 Check-in","14:00"],["🕙 Check-out","11:00"],["❌ Free cancel","48h before arrival"],["💳 Payment","Pay at hotel or online"]].map(([k,v])=>(
                <div key={k} style={{background:"#fdf8f0",border:"1px solid #f0e8df",borderRadius:10,padding:".9rem"}}><strong style={{fontSize:".88rem",color:"#0f1c2e"}}>{k}</strong><br/><span style={{fontSize:".84rem",color:"#718096"}}>{v}</span></div>
              ))}
            </div>
          </div>
        </div>

        <div style={{position:"sticky",top:88}}>
          <div style={{background:"#fff",border:"1px solid #f0e8df",borderRadius:16,overflow:"hidden",boxShadow:"0 8px 30px rgba(15,28,46,.12)"}}>
            <div style={{background:"linear-gradient(135deg,#0f1c2e,#1a3c5e)",color:"#fff",padding:"1.25rem 1.5rem"}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:"1.6rem",fontWeight:700}}>{fETB(room.basePrice)}</span>
              <span style={{fontSize:".85rem",color:"rgba(255,255,255,.7)"}}> / night</span>
            </div>
            <div style={{padding:"0 1.25rem 1.25rem"}}>
              <DemoBanner message="Booking submission connects to Module 5 (Reservations). Dates are captured — click Book Now to see the status." />
              {[["Check In","checkIn","date",today],["Check Out","checkOut","date",bk.checkIn||today]].map(([l,n,t,m])=>(
                <div className="form-group" key={n}>
                  <label className="form-label">{l}</label>
                  <input type={t} min={m} className="form-control" value={bk[n]} onChange={e=>setBk({...bk,[n]:e.target.value})} />
                </div>
              ))}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".75rem"}}>
                {[["Adults","adults",[1,2,3,4]],["Children","children",[0,1,2,3]]].map(([l,n,opts])=>(
                  <div className="form-group" key={n}>
                    <label className="form-label">{l}</label>
                    <select className="form-control" value={bk[n]} onChange={e=>setBk({...bk,[n]:Number(e.target.value)})}>
                      {opts.map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {nights>0&&(
                <div style={{background:"#fdf8f0",border:"1px solid #f0e8df",borderRadius:10,padding:".9rem",marginBottom:"1rem"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:".88rem",color:"#4a5568",marginBottom:".35rem"}}><span>{fETB(room.basePrice)} × {nights} night{nights>1?"s":""}</span><span>{fETB(sub)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:".88rem",color:"#4a5568",marginBottom:".5rem"}}><span>Tax (15%)</span><span>{fETB(tax)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,color:"#0f1c2e",fontSize:"1rem",paddingTop:".5rem",borderTop:"1px solid #e8ddd0"}}><span>Total</span><span>{fETB(total)}</span></div>
                </div>
              )}
              <button className="btn btn-gold btn-block btn-lg" onClick={handleBook} style={{marginTop:".25rem"}}>
                {isAuthenticated?"Book Now →":"Sign In to Book"}
              </button>
              {!isAuthenticated&&<p style={{textAlign:"center",fontSize:".8rem",color:"#718096",marginTop:".6rem"}}><Link to="/register">Create a free account</Link> to save your booking</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
