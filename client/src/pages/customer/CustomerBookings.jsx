import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { bookingsApi } from "../../api/bookings.api"

const fETB = n => new Intl.NumberFormat("en-ET",{style:"currency",currency:"ETB",maximumFractionDigits:0}).format(n)
const SB = {confirmed:"badge-success",checked_in:"badge-info",checked_out:"badge-neutral",cancelled:"badge-error",no_show:"badge-warning"}
const PB = {paid:"badge-success",pending:"badge-warning",partial:"badge-info",refunded:"badge-neutral"}

export default function CustomerBookings() {
  const [bks,setBks]=useState([])
  const [loading,setLoading]=useState(true)
  const [err,setErr]=useState("")
  const [cancelling,setCancelling]=useState(null)

  const load = async () => {
    setLoading(true); setErr("")
    try { const r = await bookingsApi.getMine(); setBks(r.data.data) }
    catch(e) { setErr(e.response?.data?.message||"Could not load bookings") }
    finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  const cancel = async id => {
    if(!window.confirm("Cancel this booking?")) return
    setCancelling(id)
    try { await bookingsApi.cancel(id); await load() }
    catch(e) { alert(e.response?.data?.message||"Cancellation failed") }
    finally { setCancelling(null) }
  }

  return (
    <div>
      <div className="dash-header" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><h2>My Bookings</h2><p>View and manage your reservations</p></div>
        <Link to="/rooms" className="btn btn-gold btn-sm">+ New Booking</Link>
      </div>
      {loading && <div className="spinner-container"><div className="spinner"/></div>}
      {err && <div className="alert alert-error">{err}</div>}
      {!loading && !err && bks.length === 0 && (
        <div style={{textAlign:"center",padding:"4rem 2rem",background:"#fff",borderRadius:16,border:"1px solid #f0e8df"}}>
          <span style={{fontSize:"3.5rem"}}>🏨</span>
          <h3 style={{marginTop:"1rem",fontFamily:"Playfair Display,serif"}}>No Reservations Yet</h3>
          <p style={{color:"#718096",marginTop:".5rem"}}>Your bookings will appear here once you make a reservation.</p>
          <Link to="/rooms" className="btn btn-gold" style={{marginTop:"1.5rem",display:"inline-flex"}}>Explore Rooms</Link>
        </div>
      )}
      {bks.map(b => (
        <div key={b._id} className="booking-card">
          <div className="booking-card-header">
            <div style={{display:"flex",alignItems:"center",gap:".75rem",flexWrap:"wrap"}}>
              <span className="booking-ref">{b.bookingRef}</span>
              <span className={"badge " + (SB[b.status]||"badge-neutral")}>{b.status.replace(/_/g," ")}</span>
              <span className={"badge " + (PB[b.paymentStatus]||"badge-neutral")}>{b.paymentStatus}</span>
            </div>
            <span style={{fontFamily:"Playfair Display,serif",fontSize:"1.2rem",fontWeight:700,color:"#0f1c2e"}}>{fETB(b.totalPrice)}</span>
          </div>
          <div className="booking-card-body">
            <strong style={{color:"#0f1c2e"}}>{b.roomType?.name||"Room"}</strong>
            {b.room?.roomNumber && <span style={{marginLeft:".75rem",color:"#718096",fontSize:".88rem"}}>Room {b.room.roomNumber}</span>}
            <div style={{display:"flex",gap:"2rem",marginTop:".75rem",flexWrap:"wrap"}}>
              {[["Check In",new Date(b.checkIn).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})],["Check Out",new Date(b.checkOut).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})],["Duration",b.nights+" night"+(b.nights!==1?"s":"")]].map(([l,v])=>(
                <div key={l}><div style={{fontSize:".7rem",color:"#718096",textTransform:"uppercase",letterSpacing:".06em"}}>{l}</div><div style={{fontWeight:600,color:"#1a1a2e",fontSize:".93rem"}}>{v}</div></div>
              ))}
            </div>
          </div>
          <div className="booking-card-footer">
            <span style={{fontSize:".82rem",color:"#718096"}}>{b.adults} adult{b.adults!==1?"s":""}</span>
            <div style={{display:"flex",gap:".5rem"}}>
              {b.status==="confirmed" && <button className="btn btn-danger btn-sm" onClick={()=>cancel(b._id)} disabled={cancelling===b._id}>{cancelling===b._id?"Cancelling...":"Cancel"}</button>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}