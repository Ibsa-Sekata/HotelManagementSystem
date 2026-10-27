import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { roomsApi, roomTypesApi } from "../../api/rooms.api"
import RoomCard from "../../components/rooms/RoomCard"

export default function RoomsPage() {
  const [sp, setSp] = useSearchParams()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const today = new Date().toISOString().split("T")[0]
  const [f, setF] = useState({ checkIn:sp.get("checkIn")||"", checkOut:sp.get("checkOut")||"", guests:sp.get("guests")||"", minPrice:"", maxPrice:"" })

  const fetch = useCallback(async ff => {
    setLoading(true); setError("")
    try {
      const p={}; if(ff.checkIn)p.checkIn=ff.checkIn; if(ff.checkOut)p.checkOut=ff.checkOut; if(ff.guests)p.guests=ff.guests; if(ff.minPrice)p.minPrice=ff.minPrice; if(ff.maxPrice)p.maxPrice=ff.maxPrice
      const res = (ff.checkIn&&ff.checkOut) ? await roomsApi.search(p) : await roomTypesApi.getAll(p)
      setRooms(res.data.data)
    } catch(e){ setError(e.response?.data?.message||"Failed to load rooms. Is the server running?") }
    finally{ setLoading(false) }
  },[])

  useEffect(()=>{ fetch(f) },[]) // eslint-disable-line

  const go = e => { e.preventDefault(); const np={}; if(f.checkIn)np.checkIn=f.checkIn; if(f.checkOut)np.checkOut=f.checkOut; if(f.guests)np.guests=f.guests; setSp(np); fetch(f) }
  const clear = () => { const empty={checkIn:"",checkOut:"",guests:"",minPrice:"",maxPrice:""}; setF(empty); setSp({}); fetch(empty) }

  return (
    <div>
      <div className="page-hero">
        <div className="container">
          <div className="page-hero-eyebrow">Rooms &amp; Suites</div>
          <h1>Discover Your Perfect Room</h1>
          <p>Curated luxury for every occasion</p>
        </div>
      </div>

      <div className="container" style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:"2rem",padding:"2.5rem 1.5rem 4rem",alignItems:"start"}}>
        <aside style={{position:"sticky",top:"88px"}}>
          <form onSubmit={go} style={{background:"#fff",border:"1px solid #f0e8df",borderRadius:16,padding:"1.5rem"}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",color:"#0f1c2e",marginBottom:"1.25rem",paddingBottom:".75rem",borderBottom:"1px solid #f0e8df"}}>Search &amp; Filter</h3>
            {[["Check In","checkIn","date",today],["Check Out","checkOut","date",f.checkIn||today]].map(([l,n,t,m])=>(
              <div className="form-group" key={n}>
                <label className="form-label">{l}</label>
                <input type={t} min={m} className="form-control" value={f[n]} onChange={e=>setF({...f,[n]:e.target.value})} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Guests</label>
              <select className="form-control" value={f.guests} onChange={e=>setF({...f,guests:e.target.value})}>
                <option value="">Any</option>
                {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Min Price (ETB)</label>
              <input type="number" className="form-control" min="0" placeholder="0" value={f.minPrice} onChange={e=>setF({...f,minPrice:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Price (ETB)</label>
              <input type="number" className="form-control" min="0" placeholder="Any" value={f.maxPrice} onChange={e=>setF({...f,maxPrice:e.target.value})} />
            </div>
            <button type="submit" className="btn btn-navy btn-block">Search Rooms</button>
            {(f.checkIn||f.checkOut||f.guests||f.minPrice||f.maxPrice)&&<button type="button" className="btn btn-ghost btn-block" style={{marginTop:".6rem"}} onClick={clear}>Clear Filters</button>}
          </form>
        </aside>

        <main>
          {loading&&<div className="spinner-container"><div className="spinner"/></div>}
          {error&&<div className="alert alert-error">{error}</div>}
          {!loading&&!error&&<p style={{fontSize:".88rem",color:"#718096",marginBottom:"1.1rem"}}>{rooms.length} room type{rooms.length!==1?"s":""} found</p>}
          {!loading&&!error&&rooms.length===0&&(
            <div style={{textAlign:"center",padding:"4rem 2rem",background:"#fff",borderRadius:16,border:"1px solid #f0e8df"}}>
              <span style={{fontSize:"3rem"}}>🏨</span>
              <h3 style={{marginTop:".75rem"}}>No rooms found</h3>
              <p style={{color:"#718096",marginTop:".5rem"}}>Try adjusting your dates or filters.</p>
              <button onClick={clear} className="btn btn-gold" style={{marginTop:"1.25rem"}}>Clear Filters</button>
            </div>
          )}
          {!loading&&!error&&rooms.length>0&&(
            <div className="grid-2">{rooms.map(r=><RoomCard key={r._id} room={r} checkIn={f.checkIn} checkOut={f.checkOut} />)}</div>
          )}
        </main>
      </div>
    </div>
  )
}
