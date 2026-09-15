"use client"
import { useEffect, useRef, useState } from "react"

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

export default function Presentation() {
  const [mounted, setMounted] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const phoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  function onMove(e: React.MouseEvent) {
    const el = phoneRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setTilt({ x: py * -14, y: px * 16 })
  }
  function onLeave() { setTilt({ x: 0, y: 0 }) }

  return (
    <main style={{ background: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', overflowX: 'hidden' }}>

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

        {/* Phone mockup with mouse-tilt */}
        <div
          ref={phoneRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          style={{
            marginTop: '56px', perspective: '1000px', position: 'relative', zIndex: 1,
            opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.9)',
            transition: 'opacity 0.9s ease 0.55s, transform 0.9s ease 0.55s'
          }}
        >
          <div style={{
            width: '260px', borderRadius: '34px', padding: '10px',
            background: 'linear-gradient(160deg,#1c1c1e,#0a0a0b)',
            boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6)',
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: 'transform 0.15s ease-out',
            transformStyle: 'preserve-3d'
          }}>
            <div style={{ borderRadius: '25px', overflow: 'hidden', background: '#fff' }}>
              <div style={{ background: 'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)', padding: '18px 16px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <svg width="14" height="14" viewBox="0 0 60 60"><path d="M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z" fill="url(#phoneStar)" /><defs><linearGradient id="phoneStar" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#2B7FFF" /><stop offset="100%" stopColor="#D4A843" /></linearGradient></defs></svg>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '1.5px' }}>NEXIA</span>
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>mardi 15 septembre</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '2px 0 8px' }}>Bonjour, Léa</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ fontSize: '9px', color: '#86efac', fontWeight: 600 }}>+1&apos;780 CHF</div>
                </div>
              </div>
              <div style={{ background: '#f0f4ff', padding: '10px' }}>
                <div style={{ background: 'rgba(15,45,92,0.9)', borderRadius: '10px', padding: '9px', display: 'flex', gap: '4px', marginBottom: '7px' }}>
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '6px', color: 'rgba(255,255,255,0.5)' }}>{d}</div>
                      <div style={{ fontSize: '8px', fontWeight: 700, color: i === 1 ? '#1e56a0' : '#fff', background: i === 1 ? '#fff' : 'transparent', borderRadius: '4px', marginTop: '2px' }}>{12 + i}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'rgba(15,45,92,0.9)', borderRadius: '10px', padding: '9px' }}>
                  <div style={{ fontSize: '7px', color: '#a8d8f0', fontWeight: 600, marginBottom: '3px' }}>FINANCES</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#86efac' }}>+1&apos;780 CHF</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
