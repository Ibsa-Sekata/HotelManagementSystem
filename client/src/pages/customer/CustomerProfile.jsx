import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { authApi } from "../../api/auth.api"

export default function CustomerProfile() {
  const { user, updateUser } = useAuth()
  const [form,setForm]=useState({firstName:user?.firstName||"",lastName:user?.lastName||"",phone:user?.phone||""})
  const [ok,setOk]=useState(""); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false)
  const [pw,setPw]=useState({currentPassword:"",newPassword:""}); const [pwOk,setPwOk]=useState(""); const [pwErr,setPwErr]=useState(""); const [pwLoad,setPwLoad]=useState(false)

  const saveProfile = async e => {
    e.preventDefault(); setOk(""); setErr(""); setLoading(true)
    try { const r = await authApi.updateMe(form); updateUser(r.data.user); setOk("Profile updated successfully.") }
    catch(ex) { setErr(ex.response?.data?.message||"Update failed.") }
    finally { setLoading(false) }
  }

  const changePw = async e => {
    e.preventDefault(); setPwOk(""); setPwErr(""); setPwLoad(true)
    try { await authApi.changePassword(pw); setPwOk("Password changed. Please log in again on other devices."); setPw({currentPassword:"",newPassword:""}) }
    catch(ex) { setPwErr(ex.response?.data?.message||"Password change failed.") }
    finally { setPwLoad(false) }
  }

  return (
    <div>
      <div className="dash-header"><h2>My Profile</h2><p>Update your account information</p></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))",gap:"2rem"}}>
        <div className="luxury-card" style={{padding:"1.75rem"}}>
          <h3 style={{fontFamily:"Playfair Display,serif",fontSize:"1.1rem",color:"#0f1c2e",marginBottom:"1.25rem",paddingBottom:".75rem",borderBottom:"1px solid #f0e8df"}}>Personal Information</h3>
          {ok && <div className="alert alert-success">{ok}</div>}
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={saveProfile}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 .75rem"}}>
              {[["First Name","firstName"],["Last Name","lastName"]].map(([l,n])=>(
                <div className="form-group" key={n}><label className="form-label">{l}</label><input type="text" className="form-control" value={form[n]} onChange={e=>setForm({...form,[n]:e.target.value})} required /></div>
              ))}
            </div>
            <div className="form-group"><label className="form-label">Email (read-only)</label><input type="email" className="form-control" value={user?.email||""} disabled /></div>
            <div className="form-group"><label className="form-label">Phone</label><input type="tel" className="form-control" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+251 91 234 5678" /></div>
            <button type="submit" className="btn btn-navy" disabled={loading}>{loading?"Saving...":"Save Changes"}</button>
          </form>
        </div>
        <div className="luxury-card" style={{padding:"1.75rem"}}>
          <h3 style={{fontFamily:"Playfair Display,serif",fontSize:"1.1rem",color:"#0f1c2e",marginBottom:"1.25rem",paddingBottom:".75rem",borderBottom:"1px solid #f0e8df"}}>Change Password</h3>
          {pwOk && <div className="alert alert-success">{pwOk}</div>}
          {pwErr && <div className="alert alert-error">{pwErr}</div>}
          <form onSubmit={changePw}>
            <div className="form-group"><label className="form-label">Current Password</label><input type="password" className="form-control" required value={pw.currentPassword} onChange={e=>setPw({...pw,currentPassword:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">New Password</label><input type="password" className="form-control" required value={pw.newPassword} onChange={e=>setPw({...pw,newPassword:e.target.value})} /><p className="form-hint">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</p></div>
            <button type="submit" className="btn btn-ghost" disabled={pwLoad}>{pwLoad?"Changing...":"Change Password"}</button>
          </form>
          <div style={{marginTop:"1.5rem",paddingTop:"1.25rem",borderTop:"1px solid #f0e8df"}}>
            <div style={{fontSize:".75rem",color:"#718096",textTransform:"uppercase",letterSpacing:".06em",marginTop:".75rem"}}>Account Type</div>
            <div style={{fontSize:".95rem",color:"#1a1a2e",fontWeight:500}}>{user?.role==="customer"?"Guest Account":user?.role}</div>
            <div style={{fontSize:".75rem",color:"#718096",textTransform:"uppercase",letterSpacing:".06em",marginTop:".75rem"}}>Member Since</div>
            <div style={{fontSize:".95rem",color:"#1a1a2e",fontWeight:500}}>{user?.createdAt?new Date(user.createdAt).toLocaleDateString("en-GB",{month:"long",year:"numeric"}):"—"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}