import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setMobileOpen(false)
  }

  const dashPath = () => {
    if (!user) return '/login'
    return user.role === 'customer' ? '/dashboard' : '/staff'
  }

  return (
    <>
      <nav style={{background:'#0f1c2e',position:'sticky',top:0,zIndex:1000,boxShadow:'0 2px 20px rgba(15,28,46,.4)',height:'68px',display:'flex',alignItems:'center'}}>
        <div className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
          <Link to="/" style={{display:'flex',alignItems:'center',gap:'.6rem',textDecoration:'none'}}>
            <span style={{color:'#c9a84c',fontSize:'1.5rem'}}>♛</span>
            <span>
              <span style={{fontFamily:"'Playfair Display',Georgia,serif",color:'#fff',fontWeight:700,fontSize:'1.15rem',letterSpacing:'.02em'}}>Grand Horizon</span>
              <span style={{fontFamily:"'Playfair Display',Georgia,serif",color:'#c9a84c',fontWeight:400,fontSize:'1.15rem'}}> Hotel</span>
            </span>
          </Link>

          <div style={{display:'flex',alignItems:'center',gap:'1.75rem'}} className="nav-desktop">
            <NavLink to="/" end style={({isActive})=>({color:isActive?'#c9a84c':'rgba(255,255,255,.82)',fontWeight:isActive?600:400,fontSize:'.9rem',textDecoration:'none',borderBottom:isActive?'2px solid #c9a84c':'2px solid transparent',paddingBottom:'.2rem',transition:'all .2s'})}>Home</NavLink>
            <NavLink to="/rooms" style={({isActive})=>({color:isActive?'#c9a84c':'rgba(255,255,255,.82)',fontWeight:isActive?600:400,fontSize:'.9rem',textDecoration:'none',borderBottom:isActive?'2px solid #c9a84c':'2px solid transparent',paddingBottom:'.2rem',transition:'all .2s'})}>Rooms & Suites</NavLink>

            {isAuthenticated ? (
              <div style={{display:'flex',alignItems:'center',gap:'.85rem'}}>
                <Link to={dashPath()} style={{color:'rgba(255,255,255,.82)',fontSize:'.88rem',textDecoration:'none'}}>
                  {user?.firstName}
                </Link>
                <div style={{width:36,height:36,background:'linear-gradient(135deg,#c9a84c,#e8cc7a)',color:'#0f1c2e',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'.82rem',fontFamily:"'Playfair Display',serif"}}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <button onClick={handleLogout} style={{background:'transparent',border:'1px solid rgba(255,255,255,.3)',color:'rgba(255,255,255,.8)',padding:'.35rem .9rem',borderRadius:'6px',fontSize:'.83rem',cursor:'pointer',transition:'all .2s'}}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                <Link to="/login" style={{color:'rgba(255,255,255,.82)',fontSize:'.9rem',textDecoration:'none'}}>Sign In</Link>
                <Link to="/register" className="btn btn-gold btn-sm">Book Now</Link>
              </div>
            )}
          </div>

          <button onClick={()=>setMobileOpen(!mobileOpen)} style={{display:'none',background:'none',border:'none',color:'#fff',fontSize:'1.4rem',cursor:'pointer',padding:'.4rem'}} className="nav-hamburger" aria-label="Toggle menu">
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <>
          <div style={{position:'fixed',inset:0,background:'rgba(15,28,46,.5)',zIndex:998,backdropFilter:'blur(3px)'}} onClick={()=>setMobileOpen(false)} />
          <div style={{position:'fixed',top:0,right:0,bottom:0,width:'min(300px,85vw)',background:'#fdf8f0',zIndex:999,padding:'2rem 1.5rem',overflowY:'auto',boxShadow:'-4px 0 30px rgba(15,28,46,.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
              <span style={{fontFamily:"'Playfair Display',serif",color:'#0f1c2e',fontWeight:700,fontSize:'1.1rem'}}>♛ Menu</span>
              <button onClick={()=>setMobileOpen(false)} style={{background:'none',border:'none',fontSize:'1.3rem',cursor:'pointer',color:'#718096'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'.25rem'}}>
              {[['/',true,'Home'],[ '/rooms',false,'Rooms & Suites']].map(([to,end,label])=>(
                <Link key={to} to={to} onClick={()=>setMobileOpen(false)} style={{padding:'.85rem 1rem',color:'#1a3c5e',fontWeight:500,fontSize:'.95rem',borderRadius:'8px',display:'block'}}>
                  {label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link to={dashPath()} onClick={()=>setMobileOpen(false)} style={{padding:'.85rem 1rem',color:'#1a3c5e',fontWeight:500,fontSize:'.95rem',borderRadius:'8px',display:'block'}}>Dashboard</Link>
                  <button onClick={handleLogout} style={{padding:'.85rem 1rem',color:'#dc2626',fontWeight:500,fontSize:'.95rem',background:'none',border:'none',textAlign:'left',cursor:'pointer',borderRadius:'8px'}}>Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={()=>setMobileOpen(false)} style={{padding:'.85rem 1rem',color:'#1a3c5e',fontWeight:500,fontSize:'.95rem',borderRadius:'8px',display:'block'}}>Sign In</Link>
                  <Link to="/register" onClick={()=>setMobileOpen(false)} className="btn btn-gold" style={{marginTop:'.75rem',justifyContent:'center'}}>Book Now</Link>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`@media(max-width:768px){.nav-desktop{display:none!important}.nav-hamburger{display:block!important}}`}</style>
    </>
  )
}