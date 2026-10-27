import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { roomTypesApi } from "../../api/rooms.api"
import RoomCard from "../../components/rooms/RoomCard"

export default function HomePage() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [form, setForm] = useState({ checkIn:"", checkOut:"", guests:"2" })
  const today = new Date().toISOString().split("T")[0]
  const tomorrow = new Date(Date.now()+86400000).toISOString().split("T")[0]

  useEffect(()=>{ roomTypesApi.getAll().then(r=>setRooms(r.data.data.slice(0,3))).catch(()=>{}) },[])

  const go = e => { e.preventDefault(); const p=new URLSearchParams(); if(form.checkIn)p.set("checkIn",form.checkIn); if(form.checkOut)p.set("checkOut",form.checkOut); if(form.guests)p.set("guests",form.guests); navigate(`/rooms?${p}`) }

  return (
    <div>
      {/* HERO */}
      <section style={{position:"relative",minHeight:"94vh",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&q=80')",backgroundSize:"cover",backgroundPosition:"center"}} />
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(15,28,46,.6),rgba(15,28,46,.8))"}} />
        <div style={{position:"relative",zIndex:1,textAlign:"center",padding:"0 1.5rem",maxWidth:960,width:"100%"}}>
          <div style={{display:"inline-block",background:"rgba(201,168,76,.2)",border:"1px solid rgba(201,168,76,.4)",color:"#e8cc7a",padding:".3rem 1.2rem",borderRadius:9999,fontSize:".72rem",fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",marginBottom:"1.5rem"}}>♛ Grand Horizon Hotel</div>
          <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",color:"#fff",fontSize:"clamp(2.4rem,6vw,4.2rem)",fontWeight:700,lineHeight:1.15,marginBottom:"1.1rem"}}>Experience<br/>Royal Luxury</h1>
          <p style={{color:"rgba(255,255,255,.82)",fontSize:"1.15rem",marginBottom:"2.5rem",maxWidth:520,margin:"0 auto 2.5rem"}}>Indulge in unparalleled comfort and world-class hospitality in the heart of elegance.</p>
          <form onSubmit={go} style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"1.25rem 1.5rem",boxShadow:"0 20px 60px rgba(0,0,0,.3)",display:"flex",gap:"1rem",flexWrap:"wrap",alignItems:"flex-end",maxWidth:800,margin:"0 auto"}}>
            {[["Check In","checkIn","date",today,undefined],["Check Out","checkOut","date",form.checkIn||tomorrow,undefined]].map(([label,name,type,min])=>(
              <div key={name} style={{flex:1,minWidth:140}}>
                <label style={{display:"block",fontSize:".72rem",fontWeight:700,color:"#1a3c5e",marginBottom:".3rem",textTransform:"uppercase",letterSpacing:".06em"}}>{label}</label>
                <input type={type} min={min} value={form[name]} onChange={e=>setForm({...form,[name]:e.target.value})} style={{width:"100%",padding:".6rem .85rem",border:"1.5px solid #e8ddd0",borderRadius:8,fontSize:".93rem",color:"#1a1a2e"}} />
              </div>
            ))}
            <div style={{flex:1,minWidth:120}}>
              <label style={{display:"block",fontSize:".72rem",fontWeight:700,color:"#1a3c5e",marginBottom:".3rem",textTransform:"uppercase",letterSpacing:".06em"}}>Guests</label>
              <select value={form.guests} onChange={e=>setForm({...form,guests:e.target.value})} style={{width:"100%",padding:".6rem .85rem",border:"1.5px solid #e8ddd0",borderRadius:8,fontSize:".93rem",color:"#1a1a2e"}}>
                {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} Guest{n>1?"s":""}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-gold" style={{padding:".65rem 1.75rem",whiteSpace:"nowrap"}}>Check Availability</button>
          </form>
        </div>
      </section>

      {/* STATS */}
      <section style={{background:"#fff",padding:"2rem 0",borderBottom:"1px solid #f0e8df"}}>
        <div className="container" style={{display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:"1.5rem"}}>
          {[["15+","Years of Excellence"],["87","Luxury Rooms"],["4.8","Guest Rating"],["3","Restaurant Awards"]].map(([v,l])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.5rem",fontWeight:700,color:"#c9a84c",lineHeight:1}}>{v}</div>
              <div style={{fontSize:".8rem",color:"#718096",marginTop:".35rem",textTransform:"uppercase",letterSpacing:".06em"}}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ROOMS */}
      <section style={{padding:"5rem 0",background:"#fdf8f0"}}>
        <div className="container">
          <div className="text-center section-header">
            <div style={{color:"#c9a84c",fontSize:".78rem",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:".75rem"}}>— Our Accommodations —</div>
            <h2>Rooms &amp; Suites</h2>
            <p>From intimate doubles to grand presidential suites</p>
          </div>
          {rooms.length>0 ? (
            <div className="grid-3">{rooms.map(r=><RoomCard key={r._id} room={r} />)}</div>
          ) : (
            <div style={{textAlign:"center",padding:"3rem",color:"#718096",background:"#fff",borderRadius:16,border:"1px solid #f0e8df"}}>Room catalog loading — ensure the backend server is running.</div>
          )}
          <div style={{textAlign:"center",marginTop:"2.5rem"}}><Link to="/rooms" className="btn btn-ghost btn-lg">Explore All Rooms →</Link></div>
        </div>
      </section>

      {/* AMENITIES */}
      <section style={{background:"linear-gradient(135deg,#0f1c2e,#1a3c5e)",padding:"5rem 0"}}>
        <div className="container">
          <div className="text-center section-header">
            <div style={{color:"#c9a84c",fontSize:".78rem",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:".75rem"}}>— Hotel Facilities —</div>
            <h2 style={{color:"#fff"}}>World-Class Amenities</h2>
            <p style={{color:"rgba(255,255,255,.7)"}}>Everything curated for your perfect stay</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:"1.25rem",marginTop:"1rem"}}>
            {[["🏊","Swimming Pool"],["🧘","Spa & Wellness"],["🍽️","Fine Dining"],["🚗","Free Parking"],["📶","High-Speed WiFi"],["🏋️","Fitness Center"],["🚁","Airport Transfer"],["👶","Kids Club"]].map(([i,n])=>(
              <div key={n} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:".5rem",padding:"1.4rem 1rem",background:"rgba(255,255,255,.07)",borderRadius:12,border:"1px solid rgba(201,168,76,.15)",transition:"background .2s",cursor:"default"}}>
                <span style={{fontSize:"2rem"}}>{i}</span>
                <span style={{color:"rgba(255,255,255,.85)",fontSize:".82rem",textAlign:"center"}}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:"5.5rem 0",background:"#fdf8f0",textAlign:"center"}}>
        <div className="container">
          <div style={{color:"#c9a84c",fontSize:".78rem",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:".75rem"}}>— Reserve Your Stay —</div>
          <h2 style={{marginBottom:"1rem"}}>Ready to Experience Luxury?</h2>
          <p style={{color:"#718096",marginBottom:"2.25rem",fontSize:"1.05rem",maxWidth:480,margin:"0 auto 2.25rem"}}>Create an account to book rooms, manage reservations, and access exclusive member rates.</p>
          <div style={{display:"flex",gap:"1rem",justifyContent:"center",flexWrap:"wrap"}}>
            <Link to="/register" className="btn btn-gold btn-lg">Create Account</Link>
            <Link to="/rooms" className="btn btn-ghost btn-lg">Browse Rooms</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
