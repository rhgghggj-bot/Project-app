"use client"
import { useEffect } from "react"

export default function QRCodePage() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    script.onload = () => {
      const el = document.getElementById('qr')
      if (el && el.childElementCount === 0) {
        new (window as any).QRCode(el, {
          text: 'https://project-app-rust-delta.vercel.app/onboarding',
          width: 180, height: 180,
          colorDark: '#0A1628', colorLight: '#ffffff',
          correctLevel: 2
        })
      }
    }
    document.head.appendChild(script)
  }, [])

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px'}}>
      <div style={{border:'1px solid rgba(255,255,255,0.2)',borderRadius:'24px',padding:'32px 24px',textAlign:'center',maxWidth:'320px',width:'100%',position:'relative',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.4)'}}>
        <div style={{position:'absolute',top:'-40px',right:'-40px',width:'160px',height:'160px',borderRadius:'50%',background:'rgba(255,255,255,0.06)'}}></div>
        <div style={{fontSize:'24px',fontWeight:'700',color:'#fff',marginBottom:'4px'}}>Pro<span style={{color:'#D4A843'}}>ject</span></div>
        <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)',marginBottom:'24px'}}>Scanne pour rejoindre</div>
        <div style={{background:'#fff',borderRadius:'16px',padding:'16px',display:'inline-block',marginBottom:'24px'}}>
          <div id="qr"></div>
        </div>
        <div style={{background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:'12px',padding:'12px',marginBottom:'16px'}}>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',marginBottom:'3px'}}>Lien direct</div>
          <div style={{fontSize:'12px',color:'#a8d8f0',fontWeight:'500'}}>project-app-rust-delta.vercel.app</div>
        </div>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginBottom:'24px'}}>Gratuit · Sans publicite · Donnees privees</div>
        <button onClick={() => window.print()}
          style={{width:'100%',background:'#fff',color:'#1a3a6e',border:'none',borderRadius:'12px',padding:'14px',fontSize:'14px',fontWeight:'500',cursor:'pointer',marginBottom:'10px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a3a6e" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Imprimer / PDF
        </button>
        <a href="/profile" style={{textDecoration:'none',display:'block'}}>
          <button style={{width:'100%',background:'transparent',color:'rgba(255,255,255,0.6)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:'12px',padding:'12px',fontSize:'13px',cursor:'pointer'}}>
            Retour au profil
          </button>
        </a>
      </div>
    </main>
  )
}
