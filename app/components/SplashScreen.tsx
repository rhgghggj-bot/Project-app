"use client"
import { useEffect } from "react"

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3200)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:9999,
      background:'#0A1628',
      display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',
      fontFamily:'system-ui'
    }}>
      <style>{`
        @keyframes floatDown {
          0%   { transform: translateY(-30px) scale(0.6) rotate(0deg); opacity:0.7; }
          40%  { transform: translateY(0px) scale(1.2) rotate(180deg); opacity:1; }
          60%  { transform: translateY(0px) scale(1.2) rotate(180deg); opacity:1; }
          100% { transform: translateY(-30px) scale(0.6) rotate(360deg); opacity:0.7; }
        }
        @keyframes splash-trail {
          0%{opacity:0;transform:translateX(-30px) translateY(30px) rotate(-45deg) scaleX(0)}
          30%{opacity:0.8;transform:translateX(0) translateY(0) rotate(-45deg) scaleX(1)}
          60%{opacity:0;transform:translateX(30px) translateY(-30px) rotate(-45deg) scaleX(0)}
          100%{opacity:0;transform:translateX(-30px) translateY(30px) rotate(-45deg) scaleX(0)}
        }
        @keyframes splash-glow {
          0%,100%{filter:drop-shadow(0 0 6px rgba(43,127,255,0.5))}
          40%,60%{filter:drop-shadow(0 0 28px rgba(212,168,67,1))}
        }
        @keyframes splash-pulse {
          0%,100%{opacity:0.15;transform:scale(0.5)}
          50%{opacity:0.9;transform:scale(1.3)}
        }
        @keyframes splash-text {
          0%,100%{text-shadow:none;opacity:0.8}
          40%,60%{text-shadow:0 0 20px rgba(212,168,67,0.5);opacity:1}
        }
        @keyframes splash-fadein {
          from{opacity:0} to{opacity:1}
        }
        .splash-star { animation: floatDown 3s ease-in-out infinite, splash-glow 3s ease-in-out infinite; position:relative; z-index:2; }
        .splash-trail { position:absolute;width:40px;height:3px;background:linear-gradient(90deg,transparent,#D4A843,transparent);border-radius:99px;animation:splash-trail 3s ease-in-out infinite;transform-origin:center;top:50%;left:50%;margin:-1.5px 0 0 -20px;z-index:1; }
        .splash-trail2 { animation-delay:.15s;opacity:.5;width:25px;margin-left:-12px; }
        .splash-dot { position:absolute;border-radius:50%;animation:splash-pulse 2.5s ease-in-out infinite;top:50%;left:50%; }
        .splash-nexia { animation: splash-text 3s ease-in-out infinite; }
        .splash-wrap { animation: splash-fadein 0.5s ease; }
      `}</style>

      <div className="splash-wrap" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:0}}>
        <div style={{position:'relative',width:'140px',height:'120px',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="splash-trail"></div>
          <div className="splash-trail splash-trail2"></div>

          <div className="splash-dot" style={{width:'6px',height:'6px',background:'#D4A843',margin:'-4px 0 0 58px',animationDelay:'0s'}}></div>
          <div className="splash-dot" style={{width:'5px',height:'5px',background:'#2B7FFF',margin:'52px 0 0 -30px',animationDelay:'0.8s'}}></div>
          <div className="splash-dot" style={{width:'4px',height:'4px',background:'#fff',margin:'-54px 0 0 20px',animationDelay:'1.4s'}}></div>

          <svg className="splash-star" width="64" height="64" viewBox="0 0 60 60">
            <path d="M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z" fill="url(#splashGrad)"/>
            <defs>
              <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2B7FFF"/>
                <stop offset="100%" stopColor="#D4A843"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div style={{textAlign:'center',marginTop:'4px'}}>
          <div className="splash-nexia" style={{fontSize:'28px',fontWeight:'700',color:'#fff',letterSpacing:'3px',marginBottom:'4px'}}>NEXIA</div>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',letterSpacing:'2px'}}>Ton hub de vie</div>
        </div>
      </div>
    </div>
  )
}
