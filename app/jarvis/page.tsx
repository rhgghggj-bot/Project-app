"use client"
import { useEffect, useRef, useState } from "react"

const OLLAMA_URL = "http://localhost:11434/api/chat"
const MODEL = "llama3.1:8b"
const SYSTEM_PROMPT = "Tu es Jarvis, l'assistant IA personnel de Pierre. Tu es utile, direct, un peu spirituel mais jamais bavard inutilement. Tu réponds en français sauf si on te parle dans une autre langue. Toutes tes réponses restent strictement locales sur la machine de l'utilisateur."

type Msg = { role: "system" | "user" | "assistant"; content: string }

export default function Jarvis() {
  const [historique, setHistorique] = useState<Msg[]>([{ role: "system", content: SYSTEM_PROMPT }])
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; texte: string; erreur?: boolean }[]>([
    { role: "assistant", texte: "Bonjour Pierre. Jarvis est en ligne, en local, sur ton Mac. Comment puis-je t'aider ?" }
  ])
  const [input, setInput] = useState("")
  const [reflechit, setReflechit] = useState(false)
  const [statut, setStatut] = useState<{ texte: string; ok: boolean | null }>({ texte: "Connexion à Ollama...", ok: null })
  const chatRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const angleRef = useRef({ a: 0, a2: 0 })
  const etincellesRef = useRef<{ theta: number; phi: number; vitesse: number; vie: number }[]>([])
  const reflechitRef = useRef(false)

  useEffect(() => { reflechitRef.current = reflechit }, [reflechit])

  useEffect(() => {
    async function verifier() {
      try {
        const res = await fetch("http://localhost:11434/api/tags")
        if (res.ok) setStatut({ texte: "En ligne (local)", ok: true })
        else throw new Error()
      } catch {
        setStatut({ texte: "Ollama non détecté — lance 'brew services start ollama'", ok: false })
      }
    }
    verifier()
  }, [])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gctx = canvas.getContext("2d")
    if (!gctx) return
    const GW = canvas.width, GH = canvas.height
    const gcx = GW / 2, gcy = GH / 2
    let raf: number

    if (etincellesRef.current.length === 0) {
      etincellesRef.current = Array.from({ length: 22 }, () => ({
        theta: Math.random() * Math.PI * 2, phi: Math.acos(1 - 2 * Math.random()),
        vitesse: 0.3 + Math.random() * 0.5, vie: Math.random()
      }))
    }

    function point3D(theta: number, phi: number, r: number) {
      return { x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) }
    }
    function rotateGlobe(p: { x: number; y: number; z: number }, a: number, a2: number) {
      const y1 = p.y * Math.cos(a) - p.z * Math.sin(a)
      const z1 = p.y * Math.sin(a) + p.z * Math.cos(a)
      const x2 = p.x * Math.cos(a2) + z1 * Math.sin(a2)
      const z2 = -p.x * Math.sin(a2) + z1 * Math.cos(a2)
      return { x: x2, y: y1, z: z2 }
    }

    function dessiner() {
      const refl = reflechitRef.current
      gctx!.clearRect(0, 0, GW, GH)
      const baseR = 34
      const pulse = refl ? 1 + Math.sin(Date.now() / 140) * 0.05 : 1 + Math.sin(Date.now() / 900) * 0.015
      const R = baseR * pulse
      const intensite = refl ? 1 : 0.55
      const vitRot = refl ? 0.014 : 0.005

      angleRef.current.a += vitRot
      angleRef.current.a2 += vitRot * 0.6
      const { a, a2 } = angleRef.current

      const grillage: { x: number; y: number; z: number }[][] = []
      const NB_LAT = 8, NB_LON = 12
      for (let i = 0; i <= NB_LAT; i++) {
        const phi = (i / NB_LAT) * Math.PI
        const pts = []
        for (let j = 0; j <= 32; j++) pts.push(rotateGlobe(point3D((j / 32) * Math.PI * 2, phi, R), a, a2))
        grillage.push(pts)
      }
      for (let j = 0; j < NB_LON; j++) {
        const theta = (j / NB_LON) * Math.PI * 2
        const pts = []
        for (let i = 0; i <= 32; i++) pts.push(rotateGlobe(point3D(theta, (i / 32) * Math.PI, R), a, a2))
        grillage.push(pts)
      }

      grillage.forEach(pts => {
        gctx!.beginPath()
        pts.forEach((p, idx) => {
          const sx = gcx + p.x, sy = gcy + p.y
          if (idx === 0) gctx!.moveTo(sx, sy); else gctx!.lineTo(sx, sy)
        })
        const zAvg = pts.reduce((s, p) => s + p.z, 0) / pts.length
        const depthAlpha = 0.15 + Math.max(0, (zAvg + R) / (2 * R)) * 0.45
        gctx!.strokeStyle = `rgba(255,178,60,${depthAlpha * intensite})`
        gctx!.lineWidth = 0.6
        gctx!.stroke()
      })

      etincellesRef.current.forEach(e => {
        e.vie += 0.006 * e.vitesse * (refl ? 2.2 : 1)
        if (e.vie > 1) { e.vie = 0; e.theta = Math.random() * Math.PI * 2; e.phi = Math.acos(1 - 2 * Math.random()) }
        const r = R * (0.55 + e.vie * 0.9)
        const p = rotateGlobe(point3D(e.theta, e.phi, r), a, a2)
        const sx = gcx + p.x, sy = gcy + p.y
        const alpha = (1 - e.vie) * intensite
        gctx!.beginPath()
        gctx!.arc(sx, sy, 1.1, 0, Math.PI * 2)
        gctx!.fillStyle = `rgba(255,220,150,${alpha})`
        gctx!.fill()
      })

      const halo = gctx!.createRadialGradient(gcx, gcy, 0, gcx, gcy, R * 1.05)
      halo.addColorStop(0, `rgba(255,200,110,${0.5 * intensite})`)
      halo.addColorStop(0.6, `rgba(255,150,40,${0.18 * intensite})`)
      halo.addColorStop(1, "rgba(255,150,40,0)")
      gctx!.beginPath()
      gctx!.arc(gcx, gcy, R * 1.05, 0, Math.PI * 2)
      gctx!.fillStyle = halo
      gctx!.fill()

      const noyau = gctx!.createRadialGradient(gcx, gcy, 0, gcx, gcy, 6 * pulse)
      noyau.addColorStop(0, `rgba(255,240,210,${0.9 * intensite})`)
      noyau.addColorStop(1, "rgba(255,200,110,0)")
      gctx!.beginPath()
      gctx!.arc(gcx, gcy, 6 * pulse, 0, Math.PI * 2)
      gctx!.fillStyle = noyau
      gctx!.fill()

      raf = requestAnimationFrame(dessiner)
    }
    dessiner()
    return () => cancelAnimationFrame(raf)
  }, [])

  async function envoyer() {
    const texte = input.trim()
    if (!texte) return
    setInput("")
    setReflechit(true)

    const nouvelHistorique = [...historique, { role: "user" as const, content: texte }]
    setHistorique(nouvelHistorique)
    setMessages(prev => [...prev, { role: "user", texte }, { role: "assistant", texte: "Jarvis réfléchit..." }])

    try {
      const res = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages: nouvelHistorique, stream: true })
      })
      if (!res.ok || !res.body) throw new Error("Pas de réponse d'Ollama")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let reponseComplete = ""
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lignes = buffer.split("\n")
        buffer = lignes.pop() || ""
        for (const ligne of lignes) {
          if (!ligne.trim()) continue
          try {
            const obj = JSON.parse(ligne)
            if (obj.message?.content) {
              reponseComplete += obj.message.content
              setMessages(prev => {
                const copie = [...prev]
                copie[copie.length - 1] = { role: "assistant", texte: reponseComplete }
                return copie
              })
            }
          } catch {}
        }
      }
      setHistorique(prev => [...prev, { role: "assistant", content: reponseComplete }])
    } catch {
      setMessages(prev => {
        const copie = [...prev]
        copie[copie.length - 1] = { role: "assistant", texte: "Erreur : impossible de contacter Jarvis. Vérifie qu'Ollama tourne bien (brew services list).", erreur: true }
        return copie
      })
    }
    setReflechit(false)
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "radial-gradient(ellipse at top, #0A1628 0%, #050810 100%)", color: "#E8F1FF" }}>
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px", borderBottom: "0.5px solid rgba(43,127,255,0.2)", background: "rgba(10,22,40,0.6)" }}>
        <a href="/" style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", textDecoration: "none", marginRight: "4px" }}>←</a>
        <canvas ref={canvasRef} width={112} height={112} style={{ width: "50px", height: "50px", flexShrink: 0 }} />
        <div style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff" }}>Jarvis</div>
        <div style={{ fontSize: "11px", color: statut.ok === true ? "#10B981" : statut.ok === false ? "#F43F5E" : "rgba(232,241,255,0.4)", marginLeft: "auto" }}>{statut.texte}</div>
      </div>

      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            maxWidth: "82%", padding: "12px 16px", borderRadius: "14px", fontSize: "14px", lineHeight: 1.5, whiteSpace: "pre-wrap",
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            background: m.role === "user" ? "#2B7FFF" : "rgba(255,255,255,0.06)",
            color: m.erreur ? "#F43F5E" : m.role === "user" ? "#fff" : "#E8F1FF",
            border: m.role === "assistant" ? "0.5px solid rgba(43,127,255,0.25)" : "none",
            borderBottomRightRadius: m.role === "user" ? "3px" : "14px",
            borderBottomLeftRadius: m.role === "assistant" ? "3px" : "14px",
          }}>
            {m.texte}
          </div>
        ))}
      </div>

      <div style={{ padding: "14px 18px 20px", borderTop: "0.5px solid rgba(43,127,255,0.2)", background: "rgba(10,22,40,0.6)" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer() } }}
            rows={1}
            placeholder="Écris à Jarvis..."
            style={{ flex: 1, resize: "none", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(43,127,255,0.3)", borderRadius: "12px", padding: "12px 14px", color: "#fff", fontSize: "14px", fontFamily: "inherit", outline: "none", maxHeight: "140px" }}
          />
          <button onClick={envoyer} disabled={reflechit} style={{ background: "#2B7FFF", border: "none", borderRadius: "12px", width: "44px", height: "44px", flexShrink: 0, cursor: reflechit ? "default" : "pointer", opacity: reflechit ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
        <div style={{ fontSize: "11px", color: "rgba(232,241,255,0.3)", marginTop: "8px", textAlign: "center" }}>100% local · tes messages ne quittent jamais ton Mac</div>
      </div>
    </main>
  )
}
