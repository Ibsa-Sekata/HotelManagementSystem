import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

export default function LoginPage() {
  const { login }=useAuth(); const navigate=useNavigate(); const location=useLocation()
  const from=location.state?.from||"/"
  const [form,setForm]=useState({email:"",password:""}); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false)

  const go = async e => {
    e.preventDefault(); setErr(""); setLoading(true)
    try {
      const u=await login(form.email,form.password)
      navigate(u.role==="customer"?(from==="/"?"/dashboard":from):"/staff",{replace:true})
    } catch(ex){ setErr(ex.response?.data?.message||"Login failed. Please try again.") }
    finally{ setLoading(false) }
  }

  return (
    <div style={{minHeight:"100vh",display:"grid",gridTemplateColumns:"1fr 1fr"}}>
      <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",background:"#0f1c2e"}}>
        <img src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80" alt="Hotel lobby" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:.4}} onError={e=>{e.target.style.display="none"}} />
        <div style={{position:"relative",zIndex:1,textAlign:"center",padding:"2rem"}}>
          <div style={{color:"#c9a84c",fontSize:"3rem",marginBottom:"1rem"}}>♛</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",color:"#fff",fontSize:"2rem",marginBottom:".75rem"}}>Grand Horizon Hotel</h2>
          <p style={{color:"rgba(255,255,255,.7)",fontSize:"1rem",fontStyle:"italic"}}>Your Home Away From Home</p>
        </div>
        <style>{`@media(max-width:768px){.login-left{display:none!important}}`}</style>
      </div>
      <div className="login-left" style={{display:"flex",alignItems:"center",justifyContent:"center",background:"#fdf8f0",padding:"2rem"}}>
        <div style={{background:"#fff",borderRadius:20,padding:"2.5rem",width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(15,28,46,.12)"}}>
          <div style={{textAlign:"center",marginBottom:"2rem"}}>
            <div style={{color:"#c9a84c",fontSize:"2rem",marginBottom:".5rem"}}>♛</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",color:"#0f1c2e",fontSize:"1.6rem",marginBottom:".4rem"}}>Welcome Back</h2>
            <p style={{color:"#718096",fontSize:".9rem"}}>Sign in to manage your reservations</p>
          </div>
          {err&&<div className="alert alert-error">{err}</div>}
          <form onSubmit={go}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" required placeholder="your@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" required placeholder="••••••••" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
            </div>
            <button type="submit" className="btn btn-gold btn-block btn-lg" style={{marginTop:".5rem"}} disabled={loading}>{loading?"Signing in…":"Sign In"}</button>
          </form>
          <p style={{textAlign:"center",fontSize:".88rem",color:"#718096",marginTop:"1.5rem"}}>Don't have an account? <Link to="/register" style={{color:"#c9a84c",fontWeight:600}}>Create one</Link></p>
          <details style={{marginTop:"1.5rem",padding:".75rem",background:"#fdf8f0",borderRadius:8,border:"1px solid #f0e8df"}}>
            <summary style={{cursor:"pointer",fontSize:".78rem",color:"#718096"}}>🔧 Dev credentials</summary>
            <div style={{marginTop:".5rem",fontSize:".78rem",color:"#718096",lineHeight:1.8}}>
              <strong>Admin:</strong> admin@grandhorizon.example / Admin@12345<br/>
              <strong>Staff:</strong> receptionist@grandhorizon.example / Staff@12345<br/>
              <em>Run <code>node src/scripts/seed.js</code> in server/ first.</em>
            </div>
          </details>
        </div>
      </div>
      <style>{`@media(max-width:768px){div[style*="grid-template-columns"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}
