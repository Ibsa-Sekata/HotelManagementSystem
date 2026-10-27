import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const pwRules=[{re:/.{8,}/,t:"8+ characters"},{re:/[A-Z]/,t:"Uppercase"},{re:/[a-z]/,t:"Lowercase"},{re:/[0-9]/,t:"Number"}]

export default function RegisterPage() {
  const { register }=useAuth(); const navigate=useNavigate()
  const [form,setForm]=useState({firstName:"",lastName:"",email:"",password:"",phone:""}); const [errs,setErrs]=useState({}); const [apiErr,setApiErr]=useState(""); const [loading,setLoading]=useState(false)

  const go = async e => {
    e.preventDefault(); setApiErr(""); const ve={}
    if(!form.firstName.trim())ve.firstName="Required"
    if(!form.lastName.trim())ve.lastName="Required"
    if(!form.email.trim()||!/\S+@\S+\.\S+/.test(form.email))ve.email="Valid email required"
    const fail=pwRules.filter(r=>!r.re.test(form.password)); if(fail.length)ve.password=fail.map(r=>r.t).join(", ")
    setErrs(ve); if(Object.keys(ve).length)return
    setLoading(true)
    try { await register(form); navigate("/dashboard",{replace:true}) }
    catch(ex){
      const d=ex.response?.data
      if(d?.errors?.length){ const m={}; d.errors.forEach(({field,message})=>{m[field]=message}); setErrs(m) }
      else setApiErr(d?.message||"Registration failed. Please try again.")
    }
    finally{ setLoading(false) }
  }

  return (
    <div style={{minHeight:"100vh",display:"grid",gridTemplateColumns:"1fr 1fr"}}>
      <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",background:"#0f1c2e"}}>
        <img src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80" alt="Hotel suite" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:.4}} onError={e=>{e.target.style.display="none"}} />
        <div style={{position:"relative",zIndex:1,textAlign:"center",padding:"2rem"}}>
          <div style={{color:"#c9a84c",fontSize:"3rem",marginBottom:"1rem"}}>♛</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",color:"#fff",fontSize:"2rem",marginBottom:".75rem"}}>Create Account</h2>
          <p style={{color:"rgba(255,255,255,.7)",fontSize:"1rem",fontStyle:"italic"}}>Join Grand Horizon Hotel</p>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",background:"#fdf8f0",padding:"2rem",overflowY:"auto"}}>
        <div style={{background:"#fff",borderRadius:20,padding:"2.5rem",width:"100%",maxWidth:460,boxShadow:"0 20px 60px rgba(15,28,46,.12)"}}>
          <div style={{textAlign:"center",marginBottom:"1.75rem"}}>
            <div style={{color:"#c9a84c",fontSize:"2rem",marginBottom:".5rem"}}>♛</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",color:"#0f1c2e",fontSize:"1.5rem",marginBottom:".4rem"}}>Create Account</h2>
            <p style={{color:"#718096",fontSize:".9rem"}}>Join Grand Horizon Hotel</p>
          </div>
          {apiErr&&<div className="alert alert-error">{apiErr}</div>}
          <form onSubmit={go}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 .75rem"}}>
              {[["First Name","firstName","text"],["Last Name","lastName","text"]].map(([l,n,t])=>(
                <div className="form-group" key={n}>
                  <label className="form-label">{l}</label>
                  <input type={t} className={`form-control${errs[n]?" error":""}`} value={form[n]} onChange={e=>{setForm({...form,[n]:e.target.value});setErrs({...errs,[n]:""})}} required />
                  {errs[n]&&<p className="form-error">{errs[n]}</p>}
                </div>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className={`form-control${errs.email?" error":""}`} placeholder="your@email.com" value={form.email} onChange={e=>{setForm({...form,email:e.target.value});setErrs({...errs,email:""})}} required />
              {errs.email&&<p className="form-error">{errs.email}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input type="tel" className="form-control" placeholder="+251 91 234 5678" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className={`form-control${errs.password?" error":""}`} placeholder="Min 8 chars, uppercase, number" value={form.password} onChange={e=>{setForm({...form,password:e.target.value});setErrs({...errs,password:""})}} required />
              {errs.password&&<p className="form-error">{errs.password}</p>}
              {form.password&&<div style={{display:"flex",flexWrap:"wrap",gap:".35rem",marginTop:".4rem"}}>{pwRules.map(r=><span key={r.t} style={{fontSize:".72rem",color:r.re.test(form.password)?"#198754":"#c9a84c",transition:"color .2s"}}>{r.re.test(form.password)?"✓":"○"} {r.t}</span>)}</div>}
            </div>
            <button type="submit" className="btn btn-gold btn-block btn-lg" disabled={loading}>{loading?"Creating account…":"Create Account"}</button>
          </form>
          <p style={{textAlign:"center",fontSize:".88rem",color:"#718096",marginTop:"1.5rem"}}>Already have an account? <Link to="/login" style={{color:"#c9a84c",fontWeight:600}}>Sign in</Link></p>
        </div>
      </div>
      <style>{`@media(max-width:768px){div[style*="grid-template-columns:1fr 1fr"]{grid-template-columns:1fr!important}div[style*="grid-template-columns:'1fr 1fr'"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}
