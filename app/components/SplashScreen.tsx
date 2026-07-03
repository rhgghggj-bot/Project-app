"use client"
import { useEffect, useState } from "react"

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2800)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:9999,
      background:'linear-gradient(135deg,#0A1628,#1a3a6e,#2B7FFF)',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      fontFamily:'system-ui'
    }}>
      <style>{`
        @keyframes pixar {
          0%   { transform: scale(0.1) translateY(80px); opacity:0; }
          20%  { transform: scale(1.3) translateY(-20px); opacity:1; }
          35%  { transform: scale(0.9) translateY(0px); }
          50%  { transform: scale(1.15) translateY(-10px); }
          65%  { transform: scale(0.95) translateY(0px); }
          80%  { transform: scale(1.05) translateY(-4px); }
          100% { transform: scale(1) translateY(0px); }
        }
        @keyframes shadow-anim {
          0%   { transform: scaleX(0.1); opacity:0; }
          20%  { transform: scaleX(1.4); opacity:0.4; }
          35%  { transform: scaleX(0.8); opacity:0.6; }
          50%  { transform: scaleX(1.2); opacity:0.4; }
          65%  { transform: scaleX(0.9); opacity:0.5; }
          80%  { transform: scaleX(1.05); opacity:0.45; }
          100% { transform: scaleX(1); opacity:0.5; }
        }
        @keyframes fadein {
          0%,60% { opacity:0; transform:translateY(10px); }
          100% { opacity:1; transform:translateY(0); }
        }
        @keyframes dots {
          0%,80%,100% { opacity:0.3; }
          40% { opacity:1; }
        }
        .splash-logo { animation: pixar 1.4s cubic-bezier(0.36,0.07,0.19,0.97) 0.3s both; }
        .splash-shadow { animation: shadow-anim 1.4s cubic-bezier(0.36,0.07,0.19,0.97) 0.3s both; }
        .splash-text { animation: fadein 0.6s ease 1.8s both; }
        .splash-d1 { animation: dots 1.2s 2.2s infinite; }
        .splash-d2 { animation: dots 1.2s 2.4s infinite; }
        .splash-d3 { animation: dots 1.2s 2.6s infinite; }
      `}</style>

      <div style={{position:'absolute',top:'-60px',right:'-60px',width:'250px',height:'250px',borderRadius:'50%',background:'rgba(43,127,255,0.15)'}}></div>
      <div style={{position:'absolute',bottom:'-40px',left:'-40px',width:'180px',height:'180px',borderRadius:'50%',background:'rgba(135,206,235,0.1)'}}></div>

      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px',zIndex:1}}>
        <div className="splash-logo" style={{width:'90px',height:'90px',borderRadius:'24px',background:'rgba(255,255,255,0.12)',border:'1.5px solid rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontSize:'32px',fontWeight:'500',color:'#fff',letterSpacing:'-1px'}}>Pro<span style={{color:'#D4A843'}}>j</span></span>
        </div>

        <div className="splash-shadow" style={{width:'70px',height:'8px',borderRadius:'50%',background:'rgba(0,0,0,0.3)',marginTop:'4px',filter:'blur(4px)'}}></div>

        <div className="splash-text" style={{textAlign:'center',marginTop:'12px'}}>
          <div style={{fontSize:'28px',fontWeight:'500',color:'#fff',letterSpacing:'-0.5px'}}>Pro<span style={{color:'#D4A843'}}>ject</span></div>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.5)',marginTop:'4px'}}>Ton hub de vie</div>
        </div>

        <div style={{marginTop:'28px',display:'flex',gap:'6px'}}>
          <div className="splash-d1" style={{width:'6px',height:'6px',borderRadius:'50%',background:'#fff'}}></div>
          <div className="splash-d2" style={{width:'6px',height:'6px',borderRadius:'50%',background:'#fff'}}></div>
          <div className="splash-d3" style={{width:'6px',height:'6px',borderRadius:'50%',background:'#fff'}}></div>
        </div>
      </div>
    </div>
  )
}
