"use client"
import { useEffect, useRef } from "react"
import gsap from "gsap"

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([])
  const bookRef = useRef<HTMLDivElement>(null)
  const pageLeftRef = useRef<HTMLDivElement>(null)
  const pageRightRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ onComplete: onDone })
    const logo = logoRef.current
    const letters = lettersRef.current
    const book = bookRef.current
    const pageL = pageLeftRef.current
    const pageR = pageRightRef.current
    const flash = flashRef.current

    // 1. Lettres apparaissent une par une en gris
    tl.set(letters, { opacity: 0, y: 10, color: 'rgba(255,255,255,0.2)' })
    tl.set(logo, { y: -300, opacity: 0, scaleY: 1 })
    tl.set(book, { opacity: 0 })
    tl.set(flash, { opacity: 0 })

    letters.forEach((l, i) => {
      tl.to(l, { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out' }, i * 0.1)
    })

    // 2. Logo tombe comme une étoile
    tl.to(logo, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.in' }, 1.0)
    tl.to(logo, { scaleY: 0.6, duration: 0.08, ease: 'power2.in' }, 1.35)
    tl.to(logo, { scaleY: 1.2, y: -20, duration: 0.12, ease: 'power2.out' }, 1.43)
    tl.to(logo, { scaleY: 0.9, y: 5, duration: 0.08 }, 1.55)
    tl.to(logo, { scaleY: 1, y: 0, duration: 0.08 }, 1.63)

    // 3. Logo rebondit sur chaque lettre une par une
    const positions = [-126, -90, -54, -18, 18, 54, 90]
    letters.forEach((l, i) => {
      const pos = positions[i]
      tl.to(logo, { x: pos, duration: 0.18, ease: 'power1.inOut' })
      tl.to(logo, { scaleY: 0.65, y: 8, duration: 0.08, ease: 'power2.in' })
      tl.to(logo, { scaleY: 1.15, y: -18, duration: 0.1, ease: 'power2.out' })
      tl.to(logo, { scaleY: 1, y: 0, duration: 0.08 })
      tl.to(l, { color: i % 2 === 0 ? '#ffffff' : '#D4A843', scale: 1.1, duration: 0.1 }, '<-0.1')
      tl.to(l, { scale: 1, duration: 0.1 })
    })

    // 4. Logo revient au centre et grossit (zoom vers toi)
    tl.to(logo, { x: 0, y: 0, duration: 0.4, ease: 'power2.inOut' })
    tl.to(logo, { scale: 3, duration: 0.6, ease: 'power3.inOut' })

    // 5. Livre s'ouvre - pages qui défilent
    tl.set(book, { opacity: 1, scale: 3 })
    tl.set(logo, { opacity: 0 })

    // Pages qui défilent rapidement
    for (let i = 0; i < 5; i++) {
      tl.to(pageL, { rotationY: -100, duration: 0.08, ease: 'power1.in', transformOrigin: 'right center', transformPerspective: 600 })
      tl.to(pageR, { rotationY: 100, duration: 0.08, ease: 'power1.in', transformOrigin: 'left center', transformPerspective: 600 }, '<')
      tl.to([pageL, pageR], { rotationY: 0, duration: 0.06 })
    }

    // 6. Zoom dans le livre
    tl.to(book, { scale: 15, opacity: 0, duration: 0.4, ease: 'power3.in' })

    // 7. Flash blanc
    tl.to(flash, { opacity: 1, duration: 0.2 })
    tl.to(flash, { opacity: 1, duration: 0.3 })

    return () => { tl.kill() }
  }, [onDone])

  return (
    <div ref={containerRef} style={{
      position:'fixed',inset:0,zIndex:9999,
      background:'linear-gradient(135deg,#0A1628,#1a3a6e,#2B7FFF)',
      display:'flex',alignItems:'center',justifyContent:'center',
      fontFamily:'system-ui'
    }}>
      <div style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
        {/* Lettres PROJECT */}
        <div style={{display:'flex',gap:'2px',position:'relative'}}>
          {'Project'.split('').map((letter, i) => (
            <span
              key={i}
              ref={el => { lettersRef.current[i] = el }}
              style={{
                fontSize:'38px',
                fontWeight:'700',
                display:'inline-block',
                color:'rgba(255,255,255,0.2)'
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Logo carré */}
        <div ref={logoRef} style={{
          position:'absolute',
          top:'-80px',
          left:'50%',
          transform:'translateX(-50%)',
          width:'56px',height:'56px',
          borderRadius:'16px',
          background:'linear-gradient(135deg,rgba(255,255,255,0.2),rgba(212,168,67,0.25))',
          border:'1.5px solid rgba(255,255,255,0.4)',
          display:'flex',alignItems:'center',justifyContent:'center',
          zIndex:10
        }}>
          <span style={{fontSize:'18px',fontWeight:'700',color:'#fff',letterSpacing:'-1px'}}>
            Pro<span style={{color:'#D4A843'}}>j</span>
          </span>
        </div>

        {/* Livre */}
        <div ref={bookRef} style={{
          position:'absolute',
          width:'56px',height:'56px',
          display:'flex',
          zIndex:11
        }}>
          <div ref={pageLeftRef} style={{
            width:'28px',height:'56px',
            background:'linear-gradient(135deg,#fff,#dce8ff)',
            borderRadius:'4px 0 0 4px',
            transformOrigin:'right center'
          }}/>
          <div ref={pageRightRef} style={{
            width:'28px',height:'56px',
            background:'linear-gradient(135deg,#dce8ff,#fff)',
            borderRadius:'0 4px 4px 0',
            transformOrigin:'left center'
          }}/>
        </div>
      </div>

      {/* Flash blanc */}
      <div ref={flashRef} style={{
        position:'absolute',inset:0,
        background:'#fff',
        pointerEvents:'none',
        zIndex:20
      }}/>
    </div>
  )
}
