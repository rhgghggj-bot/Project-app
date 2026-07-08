"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Onboarding() {
  const [slide, setSlide] = useState(1)
  const router = useRouter()

  const CardFeature = ({ icon, title, sub }: any) => (
    <div style={{background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:'14px',padding:'14px',display:'flex',flexDirection:'column',alignItems:'flex-start',gap:'6px'}}>
      {icon}
      <div style={{fontSize:'13px',fontWeight:'500',color:'#fff'}}>{title}</div>
      <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)'}}>{sub}</div>
    </div>
  )

  const CardRow = ({ icon, title, sub }: any) => (
    <div style={{background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:'14px',padding:'14px',display:'flex',alignItems:'center',gap:'12px',marginBottom:'10px'}}>
      {icon}
      <div>
        <div style={{fontSize:'13px',fontWeight:'500',color:'#fff',marginBottom:'2px'}}>{title}</div>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)'}}>{sub}</div>
      </div>
    </div>
  )

  const Dots = ({ current }: any) => (
    <div style={{display:'flex',justifyContent:'center',gap:'6px',marginBottom:'28px'}}>
      {[1,2,3].map(i => (
        <div key={i} style={{height:'4px',borderRadius:'99px',background: i===current ? '#fff' : 'rgba(255,255,255,0.3)',width: i===current ? '24px' : '8px',transition:'all 0.3s'}}></div>
      ))}
    </div>
  )

  const Logo = ({ size = 72 }: any) => (
    <div style={{width:size+'px',height:size+'px',borderRadius:'20px',background:'rgba(255,255,255,0.12)',border:'1.5px solid rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
      <span style={{fontSize:size/3+'px',fontWeight:'700',color:'#fff',letterSpacing:'-1px'}}>Pro<span style={{color:'#D4A843'}}>j</span></span>
    </div>
  )

  const bg = {background:'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',minHeight:'100vh',padding:'40px 24px 32px',display:'flex',flexDirection:'column' as any,position:'relative' as any,overflow:'hidden' as any}
  const btn = {width:'100%',background:'#fff',color:'#1a3a6e',border:'none',borderRadius:'14px',padding:'16px',fontSize:'15px',fontWeight:'500',cursor:'pointer',marginBottom:'10px'} as any
  const btnSec = {width:'100%',background:'transparent',color:'rgba(255,255,255,0.7)',border:'0.5px solid rgba(255,255,255,0.25)',borderRadius:'14px',padding:'14px',fontSize:'14px',cursor:'pointer'} as any

  return (
    <main style={bg}>
      <div style={{position:'absolute',top:'-40px',right:'-40px',width:'200px',height:'200px',borderRadius:'50%',background:'rgba(255,255,255,0.06)'}}></div>

      {slide === 1 && (
        <>
          <Dots current={1} />
          <div style={{textAlign:'center',marginBottom:'28px'}}>
            <Logo />
            <div style={{fontSize:'24px',fontWeight:'500',color:'#fff',marginBottom:'8px',lineHeight:'1.3'}}>Ton hub de vie<br/>tout-en-un</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)',lineHeight:'1.6'}}>Gère tes finances, ton calendrier,<br/>tes groupes et tes impôts en Suisse</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'28px',flex:1}}>
            <CardFeature
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
              title="Finances" sub="Revenus & dépenses" />
            <CardFeature
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a8d8f0" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>}
              title="Groupes" sub="Chat & appels vidéo" />
            <CardFeature
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fcd34d" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
              title="Calendrier" sub="Événements & rappels" />
            <CardFeature
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
              title="Fiscalité" sub="Calculateur CH 2025" />
          </div>
          <button onClick={() => setSlide(2)} style={btn}>Suivant →</button>
        </>
      )}

      {slide === 2 && (
        <>
          <Dots current={2} />
          <div style={{textAlign:'center',marginBottom:'24px'}}>
            <div style={{fontSize:'24px',fontWeight:'500',color:'#fff',marginBottom:'8px',lineHeight:'1.3'}}>Tout ce dont<br/>tu as besoin</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)'}}>Des outils pensés pour ta vie en Suisse romande</div>
          </div>
          <div style={{flex:1,marginBottom:'24px'}}>
            <CardRow
              icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.5" style={{flexShrink:0}}><polyline points="4 7 4 4 7 4"/><polyline points="17 4 20 4 20 7"/><polyline points="20 17 20 20 17 20"/><polyline points="7 20 4 20 4 17"/><line x1="4" y1="12" x2="20" y2="12"/></svg>}
              title="Scanner de documents" sub="Scanne une facture → ajoutée automatiquement" />
            <CardRow
              icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fcd34d" strokeWidth="1.5" style={{flexShrink:0}}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
              title="Calculateur fiscal romand" sub="GE, VD, VS, FR, NE, JU — vrais taux 2025" />
            <CardRow
              icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a8d8f0" strokeWidth="1.5" style={{flexShrink:0}}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12"/><circle cx="12" cy="12" r="10"/></svg>}
              title="Appels vidéo & jeux" sub="Quiz, Puissance 4, appels en groupe" />
            <CardRow
              icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="1.5" style={{flexShrink:0}}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
              title="Simulation d'épargne" sub="Livret A, PEA, 3e pilier, ETF..." />
          </div>
          <button onClick={() => setSlide(3)} style={btn}>Suivant →</button>
        </>
      )}

      {slide === 3 && (
        <>
          <Dots current={3} />
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',marginBottom:'28px'}}>
            <Logo size={80} />
            <div style={{fontSize:'26px',fontWeight:'500',color:'#fff',marginBottom:'12px',lineHeight:'1.3'}}>Prêt à commencer ?</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)',lineHeight:'1.7'}}>Gratuit, sans publicité.<br/>Tes données restent privées.</div>
          </div>
          <button onClick={() => router.push('/inscription')} style={btn}>Créer mon compte</button>
          <button onClick={() => router.push('/connexion')} style={btnSec}>J'ai déjà un compte</button>
        </>
      )}
    </main>
  )
}
