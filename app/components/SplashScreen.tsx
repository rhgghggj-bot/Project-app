"use client"
import { useEffect, useRef } from "react"
import gsap from "gsap"

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const logoRef = useRef<HTMLDivElement>(null)
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([])
  const bookRef = useRef<HTMLDivElement>(null)
  const pageLeftRef = useRef<HTMLDivElement>(null)
  const pageRightRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ onComplete: onDone })
    const logo = logoRef.current
    const letters = lettersRef.current
    const shadow = shadowRef.current
    const book = bookRef.current
    const pageL = pageLeftRef.current
    const pageR = pageRightRef.current
    const flash = flashRef.current

    gsap.set(logo, { y: -400, opacity: 0, scale: 1, x: 0 })
    gsap.set(shadow, { scaleX: 0, opacity: 0 })
    gsap.set(letters, { opacity: 0, y: 15 })
    gsap.set(book, { opacity: 0, scale: 1 })
    gsap.set(flash, { opacity: 0 })

    // 1. Lettres apparaissent
    letters.forEach((l, i) => {
      tl.to(l, { opacity: 0.3, y: 0, duration: 0.2, ease: 'back.out(2)' }, 0.1 + i * 0.08)
    })

    // 2. Logo tombe avec boing
    tl.to(logo, { y: 0, opacity: 1, duration: 0.8, ease: 'elastic.out(1.2, 0.4)' }, 1.0)
    tl.to(shadow, { scaleX: 1, opacity: 0.4, duration: 0.8, ease: 'elastic.out(1.2, 0.4)' }, 1.0)

    // 3. Rebond sur chaque lettre
    const xPositions = [-114, -78, -42, -6, 30, 66, 102]
    letters.forEach((l, i) => {
      tl.to(logo, { x: xPositions[i], duration: 0.22, ease: 'power2.inOut' })
      tl.to(shadow, { x: xPositions[i], duration: 0.22, ease: 'power2.inOut' }, '<')
      tl.to(logo, { y: -35, scaleX: 0.88, scaleY: 1.18, duration: 0.15, ease: 'power2.out' })
      tl.to(logo, { y: 0, scaleX: 1.12, scaleY: 0.78, duration: 0.1, ease: 'power2.in' })
      tl.to(logo, { y: -15, scaleX: 0.94, scaleY: 1.08, duration: 0.1, ease: 'power2.out' })
      tl.to(logo, { y: 0, scaleX: 1, scaleY: 1, duration: 0.12, ease: 'elastic.out(2, 0.4)' })
      tl.to(shadow, { scaleX: 0.6, opacity: 0.2, duration: 0.1 }, '<-0.22')
      tl.to(shadow, { scaleX: 1, opacity: 0.4, duration: 0.12 })
      tl.to(l, { opacity: 1, color: i % 2 === 0 ? '#ffffff' : '#D4A843', scaleY: 0.85, y: 5, duration: 0.08 }, '<-0.22')
      tl.to(l, { scaleY: 1, y: 0, duration: 0.15, ease: 'elastic.out(2, 0.3)' })
    })

    // 4. Logo vient SE PLACER DEVANT les lettres à plat (reste à sa taille normale)
    tl.to(logo, { x: 0, y: 0, duration: 0.5, ease: 'power3.inOut' })
    tl.to(shadow, { opacity: 0, duration: 0.3 }, '<')
    // Z-index boost pour passer devant les lettres
    tl.set(logo, { zIndex: 20 })

    // Petite pause pour voir le logo devant
    tl.to(logo, { scale: 1, duration: 0.3 })

    // 5. ZOOM - on tombe dans le logo (comme si on rentrait dedans)
    tl.to(logo, {
      scale: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power4.in'
    })

    // 6. Flash blanc
    tl.to(flash, { opacity: 1, duration: 0.2 }, '-=0.2')
    tl.to(flash, { opacity: 1, duration: 0.4 })

    return () => { tl.kill() }
  }, [onDone])

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:9999,
      background:'linear-gradient(135deg,#0A1628,#1a3a6e,#2B7FFF)',
      display:'flex',alignItems:'center',justifyContent:'center',
      fontFamily:'system-ui',overflow:'hidden'
    }}>
      <div ref={wrapRef} style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center'}}>

        <div style={{display:'flex',gap:'4px',position:'relative',zIndex:1}}>
          {'Project'.split('').map((letter, i) => (
            <span key={i} ref={el => { lettersRef.current[i] = el }}
              style={{fontSize:'40px',fontWeight:'700',display:'inline-block',color:'rgba(255,255,255,0.2)',lineHeight:1}}>
              {letter}
            </span>
          ))}
        </div>

        <div ref={shadowRef} style={{
          width:'50px',height:'8px',borderRadius:'50%',
          background:'rgba(0,0,0,0.35)',filter:'blur(5px)',
          marginTop:'4px',transformOrigin:'center'
        }}/>

        <div ref={logoRef} style={{
          position:'absolute',top:'-20px',left:'50%',
          transform:'translateX(-50%)',
          width:'42px',height:'42px',borderRadius:'12px',
          background:'linear-gradient(135deg,rgba(255,255,255,0.18),rgba(212,168,67,0.2))',
          border:'1.5px solid rgba(255,255,255,0.45)',
          backdropFilter:'blur(10px)',
          display:'flex',alignItems:'center',justifyContent:'center',
          zIndex:10,
          boxShadow:'0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <span style={{fontSize:'13px',fontWeight:'700',color:'#fff',letterSpacing:'-1px'}}>
            Pro<span style={{color:'#D4A843'}}>j</span>
          </span>
        </div>

        <div ref={bookRef} style={{
          position:'absolute',top:'-20px',left:'50%',
          transform:'translateX(-50%)',
          width:'42px',height:'42px',display:'flex',zIndex:11
        }}>
          <div ref={pageLeftRef} style={{
            width:'21px',height:'42px',
            background:'linear-gradient(135deg,#f0f4ff,#fff)',
            borderRadius:'4px 0 0 4px',transformOrigin:'right center'
          }}/>
          <div ref={pageRightRef} style={{
            width:'21px',height:'42px',
            background:'linear-gradient(135deg,#fff,#f0f4ff)',
            borderRadius:'0 4px 4px 0',transformOrigin:'left center'
          }}/>
        </div>
      </div>

      <div ref={flashRef} style={{
        position:'absolute',inset:0,background:'#fff',
        pointerEvents:'none',zIndex:20
      }}/>
    </div>
  )
}
