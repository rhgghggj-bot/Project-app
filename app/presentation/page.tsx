"use client"
import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const StarScene3D = dynamic(() => import("../components/StarScene3D"), { ssr: false })

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.disconnect() }
    }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`
    }}>
      {children}
    </div>
  )
}

const FEATURES = [
  { title: "Finances", sub: "Revenus, dépenses, budgets et épargne suivis au CHF près", color: "#86efac",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { title: "Groupes", sub: "Discussions, appels vidéo et projets partagés entre proches", color: "#a8d8f0",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg> },
  { title: "Calendrier", sub: "Semaine, événements récurrents et vue constellation 3D", color: "#fcd34d",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { title: "Fiscalité", sub: "Calculateur d'impôts romand 2025 — GE, VD, VS, FR, NE, JU", color: "#EC4899",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
]

const STAGES = [
  { range: [0, 0.30], title: "Ton hub de vie.", sub: "Une seule app pour tout gérer, tous les jours.", size: "clamp(30px,6vw,52px)" },
  { range: [0.36, 0.64], title: "Pensé pour la Suisse.", sub: "Impôts romands, CHF, épargne — sans approximation.", size: "clamp(30px,6vw,52px)" },
  { range: [0.70, 0.94], title: "100% gratuit.", sub: "SCROLL TO CONTINUE", size: "clamp(46px,10vw,88px)" },
] as const

function stageOpacity(progress: number, [start, end]: readonly [number, number]) {
  const fade = 0.05
  if (progress < start - fade || progress > end + fade) return 0
  if (progress < start) return (progress - (start - fade)) / fade
  if (progress > end) return 1 - (progress - end) / fade
  return 1
}

function StarProductSection() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const st = ScrollTrigger.create({
      trigger: wrapRef.current,
      start: 'top top',
      end: '+=3000',
      scrub: 0.4,
      onUpdate: (self) => { progressRef.current = self.progress; setProgress(self.progress) },
    })
    return () => st.kill()
  }, [])

  const borderGlow = Math.min(1, Math.max(0, (progress - 0.30) / 0.1)) - Math.min(1, Math.max(0, (progress - 0.95) / 0.05))

  return (
    <div ref={wrapRef} style={{ height: 'calc(100vh + 3000px)', position: 'relative', background: '#050810' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* rainbow glow frame */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: borderGlow,
          padding: '5px', boxSizing: 'border-box',
          background: 'conic-gradient(from 0deg, #2B7FFF, #D4A843, #86efac, #EC4899, #2B7FFF)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude' as any,
          filter: 'saturate(1.3)'
        }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: borderGlow * 0.6,
          boxShadow: 'inset 0 0 80px 10px rgba(43,127,255,0.25), inset 0 0 80px 10px rgba(212,168,67,0.15)',
        }} />

        <div style={{ position: 'absolute', inset: 0 }}>
          <StarScene3D progressRef={progressRef} />
        </div>

        {STAGES.map((s, i) => {
          const op = stageOpacity(progress, s.range)
          if (op <= 0.01) return null
          return (
            <div key={i} style={{
              position: 'absolute', left: 0, right: 0, textAlign: 'center', padding: '0 24px',
              top: i === 2 ? '50%' : '12%', transform: i === 2 ? 'translateY(-50%)' : 'none',
              opacity: op, pointerEvents: 'none'
            }}>
              <div style={{ fontFamily: 'var(--font-geist-sans)', fontWeight: 700, fontSize: s.size, color: '#fff', letterSpacing: '-0.02em', textShadow: '0 2px 30px rgba(0,0,0,0.4)' }}>
                {s.title}
              </div>
              <div style={{ fontSize: i === 2 ? '11px' : '14px', letterSpacing: i === 2 ? '0.14em' : 'normal', color: 'rgba(255,255,255,0.55)', marginTop: '12px' }}>
                {s.sub}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Presentation() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <main style={{ background: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* ---------- HERO ---------- */}
      <section style={{
        position: 'relative', minHeight: '100vh', overflow: 'hidden',
        background: 'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '64px 24px 40px'
      }}>
        <div style={{ position: 'absolute', top: '-120px', right: '-100px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,67,0.18), transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-140px', left: '-100px', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(43,127,255,0.25), transparent 70%)' }} />

        <div style={{
          opacity: mounted ? 1 : 0, transform: mounted ? 'scale(1) rotate(0deg)' : 'scale(0.4) rotate(-30deg)',
          transition: 'opacity 0.8s cubic-bezier(.2,.9,.3,1.2), transform 0.9s cubic-bezier(.2,.9,.3,1.2)',
          marginBottom: '22px', position: 'relative', zIndex: 1
        }}>
          <svg width="64" height="64" viewBox="0 0 60 60">
            <path d="M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z" fill="url(#heroStar)" />
            <defs><linearGradient id="heroStar" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="#D4A843" /></linearGradient></defs>
          </svg>
        </div>

        <div style={{
          fontFamily: 'var(--font-geist-sans)', fontWeight: 700, fontSize: 'clamp(38px,7vw,64px)',
          color: '#fff', textAlign: 'center', lineHeight: 1.08, letterSpacing: '-0.02em',
          maxWidth: '760px', position: 'relative', zIndex: 1,
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s'
        }}>
          Ton hub de vie,<br />tout-en-un.
        </div>

        <div style={{
          fontSize: '16px', color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginTop: '18px',
          maxWidth: '480px', lineHeight: 1.6, position: 'relative', zIndex: 1,
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s'
        }}>
          Finances, calendrier, groupes et fiscalité suisse — dans une seule app, gratuite et sans publicité.
        </div>

        <div style={{
          display: 'flex', gap: '12px', marginTop: '30px', position: 'relative', zIndex: 1, flexWrap: 'wrap', justifyContent: 'center',
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 0.7s ease 0.45s, transform 0.7s ease 0.45s'
        }}>
          <a href="/inscription" style={{ textDecoration: 'none' }}>
            <button style={{ background: '#fff', color: '#1a3a6e', border: 'none', borderRadius: '99px', padding: '14px 28px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
              Créer mon compte
            </button>
          </a>
          <a href="/connexion" style={{ textDecoration: 'none' }}>
            <button style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '0.5px solid rgba(255,255,255,0.3)', borderRadius: '99px', padding: '14px 28px', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}>
              J&apos;ai déjà un compte
            </button>
          </a>
        </div>

        <div style={{
          marginTop: '48px', fontSize: '12px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em',
          position: 'relative', zIndex: 1,
          opacity: mounted ? 1 : 0, transition: 'opacity 0.7s ease 0.7s'
        }}>
          ↓ CONTINUE À FAIRE DÉFILER
        </div>
      </section>

      <StarProductSection />

      {/* ---------- TRUST STRIP ---------- */}
      <section style={{ background: '#0A1628', padding: '18px 24px', display: 'flex', gap: '28px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {['🇨🇭 100% suisse', 'Gratuit à vie', 'Sans publicité', 'Données privées'].map((t) => (
          <span key={t} style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{t}</span>
        ))}
      </section>

      {/* ---------- FEATURES ---------- */}
      <section style={{ padding: '80px 24px', maxWidth: '1040px', margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontFamily: 'var(--font-geist-sans)', fontWeight: 700, fontSize: 'clamp(28px,4vw,40px)', color: '#0A1628' }}>
              Tout ce dont tu as besoin.
            </div>
            <div style={{ fontSize: '15px', color: '#94a3b8', marginTop: '10px' }}>
              Des outils pensés pour ta vie en Suisse romande.
            </div>
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 90}>
              <div style={{
                background: 'linear-gradient(160deg,#0A1628,#1a3a6e)', borderRadius: '20px', padding: '26px',
                height: '100%', boxSizing: 'border-box'
              }}>
                <div style={{ color: f.color, marginBottom: '14px' }}>{f.icon}</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>{f.title}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{f.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section style={{
        background: 'linear-gradient(135deg,#1a3a6e,#2B7FFF)', padding: '80px 24px', textAlign: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <Reveal>
          <div style={{ fontFamily: 'var(--font-geist-sans)', fontWeight: 700, fontSize: 'clamp(26px,4vw,38px)', color: '#fff', marginBottom: '14px', position: 'relative' }}>
            Prêt à reprendre le contrôle ?
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '28px', position: 'relative' }}>
            Rejoins Nexia gratuitement, en moins d&apos;une minute.
          </div>
          <a href="/inscription" style={{ textDecoration: 'none', position: 'relative' }}>
            <button style={{ background: '#fff', color: '#1a3a6e', border: 'none', borderRadius: '99px', padding: '15px 34px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
              Créer mon compte gratuitement
            </button>
          </a>
        </Reveal>
      </section>

      <footer style={{ padding: '24px', textAlign: 'center', fontSize: '11.5px', color: '#aaa' }}>
        Nexia — Ton hub de vie. Fait avec 🇨🇭 depuis la Suisse romande.
      </footer>
    </main>
  )
}
