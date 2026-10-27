import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{background:'#0f1c2e',color:'rgba(255,255,255,.8)',padding:'3.5rem 0 0',marginTop:'auto'}}>
      <div className="container">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'2.5rem',paddingBottom:'2.5rem',borderBottom:'1px solid rgba(201,168,76,.2)'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.85rem'}}>
              <span style={{color:'#c9a84c',fontSize:'1.4rem'}}>♛</span>
              <span style={{fontFamily:"'Playfair Display',Georgia,serif",color:'#c9a84c',fontWeight:700,fontSize:'1.1rem'}}>Grand Horizon Hotel</span>
            </div>
            <p style={{fontSize:'.88rem',opacity:.75,lineHeight:1.7,marginBottom:'.75rem'}}>Your Home Away From Home.<br/>Luxury redefined in the heart of Addis Ababa.</p>
            <p style={{fontSize:'.82rem',opacity:.65}}>📞 +251 11 000 0000</p>
            <p style={{fontSize:'.82rem',opacity:.65}}>✉ info@grandhorizon.example</p>
            <p style={{fontSize:'.82rem',opacity:.65}}>📍 123 Bole Road, Addis Ababa</p>
          </div>
          <div>
            <h4 style={{color:'#c9a84c',marginBottom:'.9rem',fontSize:'.82rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em'}}>Quick Links</h4>
            <div style={{display:'flex',flexDirection:'column',gap:'.45rem'}}>
              {[['/', 'Home'],['/rooms','Rooms & Suites'],['/login','Sign In'],['/register','Create Account']].map(([to,label])=>(
                <Link key={to} to={to} style={{color:'rgba(255,255,255,.7)',fontSize:'.88rem',textDecoration:'none',transition:'color .2s'}}>{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{color:'#c9a84c',marginBottom:'.9rem',fontSize:'.82rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em'}}>Policies</h4>
            <div style={{display:'flex',flexDirection:'column',gap:'.4rem'}}>
              {['Check-in: 14:00','Check-out: 11:00','Free cancellation ≥ 48h','Late cancel: 50% first night','Pets not allowed'].map(p=>(
                <span key={p} style={{fontSize:'.83rem',opacity:.7}}>{p}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{padding:'1.5rem 0',textAlign:'center',fontSize:'.8rem',opacity:.5}}>
          © {new Date().getFullYear()} Grand Horizon Hotel · All rights reserved · Hotel Management System
        </div>
      </div>
    </footer>
  )
}