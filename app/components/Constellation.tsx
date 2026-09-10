"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"

type Evt = { id: string; titre: string; heure?: string; couleur?: string; duree?: number }

const COULEURS_CONNUES = ["#2B7FFF", "#10B981", "#F43F5E", "#D4A843", "#8B5CF6", "#F59E0B", "#EC4899"]
const NOMS_PAR_DEFAUT: Record<string, string> = {
  "#2B7FFF": "Travail",
  "#10B981": "Santé / Sport",
  "#F43F5E": "Urgent",
  "#D4A843": "Argent / Admin",
  "#8B5CF6": "Social",
  "#F59E0B": "Loisirs",
  "#EC4899": "Famille",
}

function formatDuree(min: number) {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h}h${m}` : `${h}h`
}

export default function Constellation({ evenements }: { evenements: Evt[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selected, setSelected] = useState<Evt | null>(null)
  const [domaineActif, setDomaineActif] = useState<string | null>(null)
  const [modeEdition, setModeEdition] = useState(false)
  const [noms, setNoms] = useState<Record<string, string>>(NOMS_PAR_DEFAUT)
  const stateRef = useRef({ rx: 0.4, ry: 0.6, dragging: false, lastX: 0, lastY: 0 })

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("domaines_couleur").select("*").eq("user_id", user.id)
      if (data && data.length > 0) {
        const surcharge: Record<string, string> = {}
        data.forEach((d: any) => { surcharge[d.couleur.toUpperCase()] = d.nom })
        setNoms({ ...NOMS_PAR_DEFAUT, ...surcharge })
      }
    }
    charger()
  }, [])

  function nomDomaine(couleur?: string) {
    const c = (couleur || "#2B7FFF").toUpperCase()
    return noms[c] || noms[couleur || ""] || "Autre"
  }

  async function renommer(couleur: string, nom: string) {
    setNoms(prev => ({ ...prev, [couleur]: nom }))
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("domaines_couleur").upsert({ user_id: user.id, couleur, nom }, { onConflict: "user_id,couleur" })
  }

  const parCouleur = new Map<string, { total: number; count: number; evts: Evt[] }>()
  evenements.forEach(e => {
    const c = e.couleur || "#2B7FFF"
    const cur = parCouleur.get(c) || { total: 0, count: 0, evts: [] as Evt[] }
    cur.total += e.duree || 0
    cur.count += 1
    cur.evts.push(e)
    parCouleur.set(c, cur)
  })
  const domaines = Array.from(parCouleur.entries()).sort((a, b) => b[1].total - a[1].total)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    const st = stateRef.current

    const dureeMax = Math.max(...evenements.map(e => e.duree || 30), 30)

    const pts = evenements.map((e, i) => {
      const n = Math.max(evenements.length, 1)
      const phi = Math.acos(1 - 2 * (i + 0.5) / n)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      return { x: Math.sin(phi) * Math.cos(theta), y: Math.sin(phi) * Math.sin(theta), z: Math.cos(phi), e }
    })

    function rotated(p: { x: number; y: number; z: number }) {
      const y1 = p.y * Math.cos(st.rx) - p.z * Math.sin(st.rx)
      const z1 = p.y * Math.sin(st.rx) + p.z * Math.cos(st.rx)
      const x2 = p.x * Math.cos(st.ry) + z1 * Math.sin(st.ry)
      const z2 = -p.x * Math.sin(st.ry) + z1 * Math.cos(st.ry)
      return { x: x2, y: y1, z: z2 }
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H)
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.34
      const projected = pts.map(p => {
        const r = rotated(p)
        return { sx: cx + r.x * R, sy: cy + r.y * R, z: r.z, e: p.e }
      })
      projected.sort((a, b) => a.z - b.z)
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          ctx!.strokeStyle = "rgba(43,127,255,0.12)"
          ctx!.lineWidth = 0.5
          ctx!.beginPath()
          ctx!.moveTo(projected[i].sx, projected[i].sy)
          ctx!.lineTo(projected[j].sx, projected[j].sy)
          ctx!.stroke()
        }
      }
      projected.forEach(p => {
        const dureeRatio = (p.e.duree || 30) / dureeMax
        const size = (3 + dureeRatio * 5) + (p.z + 1) * 1.5
        const estActif = !domaineActif || p.e.couleur === domaineActif
        ctx!.beginPath()
        ctx!.arc(p.sx, p.sy, size, 0, Math.PI * 2)
        ctx!.fillStyle = p.e.couleur || "#2B7FFF"
        ctx!.globalAlpha = estActif ? (0.55 + (p.z + 1) * 0.22) : 0.08
        ctx!.fill()
        ctx!.globalAlpha = 1
      })
    }

    function pointerDown(x: number, y: number) { st.dragging = true; st.lastX = x; st.lastY = y; canvas!.style.cursor = "grabbing" }
    function pointerMove(x: number, y: number) {
      if (!st.dragging) return
      st.ry += (x - st.lastX) * 0.01
      st.rx += (y - st.lastY) * 0.01
      st.lastX = x; st.lastY = y
      draw()
    }
    function pointerUp() { st.dragging = false; if (canvas) canvas.style.cursor = "grab" }

    function onClick(e: MouseEvent) {
      if (domaineActif) return
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.34
      let best: Evt | null = null, bestD = 20
      pts.forEach(p => {
        const r = rotated(p)
        const sx = cx + r.x * R, sy = cy + r.y * R
        const d = Math.hypot(e.offsetX - sx, e.offsetY - sy)
        if (d < bestD) { bestD = d; best = p.e }
      })
      if (best) setSelected(best)
    }

    const onDown = (e: MouseEvent) => pointerDown(e.offsetX, e.offsetY)
    const onMove = (e: MouseEvent) => pointerMove(e.offsetX, e.offsetY)
    const onUp = () => pointerUp()
    const onTouchStart = (e: TouchEvent) => { const r = canvas!.getBoundingClientRect(); const t = e.touches[0]; pointerDown((t.clientX - r.left) * W / r.width, (t.clientY - r.top) * H / r.height) }
    const onTouchMove = (e: TouchEvent) => { const r = canvas!.getBoundingClientRect(); const t = e.touches[0]; pointerMove((t.clientX - r.left) * W / r.width, (t.clientY - r.top) * H / r.height); e.preventDefault() }

    canvas.addEventListener("mousedown", onDown)
    canvas.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    canvas.addEventListener("touchstart", onTouchStart)
    canvas.addEventListener("touchmove", onTouchMove, { passive: false })
    canvas.addEventListener("touchend", onUp)
    canvas.addEventListener("click", onClick)

    draw()

    return () => {
      canvas.removeEventListener("mousedown", onDown)
      canvas.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      canvas.removeEventListener("touchstart", onTouchStart)
      canvas.removeEventListener("touchmove", onTouchMove)
      canvas.removeEventListener("touchend", onUp)
      canvas.removeEventListener("click", onClick)
    }
  }, [evenements, domaineActif])

  return (
    <div style={{ background: "linear-gradient(160deg,#0A1628,#1a3a6e)", borderRadius: "16px", padding: "12px", border: "0.5px solid #DCE9FF" }}>
      {evenements.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
          Aucun événement à afficher
        </div>
      ) : (
        <>
          <canvas ref={canvasRef} width={640} height={260} style={{ width: "100%", display: "block", cursor: "grab", touchAction: "none" }} />

          <div style={{ minHeight: "16px", margin: "8px 0 10px", textAlign: "center" }}>
            {selected && !domaineActif && (
              <a href={`/evenement/${selected.id}`} style={{ fontSize: "13px", color: "#fff", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: selected.couleur || "#2B7FFF", flexShrink: 0 }}></span>
                {selected.titre}{selected.heure ? ` · ${selected.heure}` : ""}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              </a>
            )}
            {!selected && !domaineActif && (
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Fais glisser pour tourner, touche un point ou un domaine</span>
            )}
            {domaineActif && (() => {
              const stats = parCouleur.get(domaineActif)
              return (
                <span style={{ fontSize: "13px", color: "#fff" }}>
                  <strong style={{ fontWeight: 500 }}>{formatDuree(stats?.total || 0)}</strong> en {nomDomaine(domaineActif)} cette semaine · {stats?.count} événement{(stats?.count || 0) > 1 ? "s" : ""}
                </span>
              )
            })()}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "0.5px solid rgba(255,255,255,0.15)", paddingTop: "10px", marginBottom: modeEdition ? "8px" : "0" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", flex: 1 }}>
              {!modeEdition && domaines.map(([couleur]) => (
                <button key={couleur}
                  onClick={() => { setSelected(null); setDomaineActif(d => d === couleur ? null : couleur) }}
                  style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    background: domaineActif === couleur ? couleur : "rgba(255,255,255,0.08)",
                    border: "none", borderRadius: "99px", padding: "4px 10px", cursor: "pointer",
                    fontSize: "11px", fontWeight: 500,
                    color: domaineActif === couleur ? "#0A1628" : "rgba(255,255,255,0.75)"
                  }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: domaineActif === couleur ? "#0A1628" : couleur, flexShrink: 0 }}></span>
                  {nomDomaine(couleur)}
                </button>
              ))}
            </div>
            <button onClick={() => { setModeEdition(v => !v); setDomaineActif(null) }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, marginLeft: "8px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              {modeEdition ? "Terminé" : "Renommer"}
            </button>
          </div>

          {modeEdition && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {COULEURS_CONNUES.map(couleur => (
                <div key={couleur} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: couleur, flexShrink: 0 }}></span>
                  <input
                    defaultValue={noms[couleur] || ""}
                    onBlur={e => renommer(couleur, e.target.value)}
                    placeholder="Nom du domaine"
                    style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "6px 10px", fontSize: "12px", color: "#fff", outline: "none" }}
                  />
                </div>
              ))}
            </div>
          )}

          {domaineActif && !modeEdition && (
            <div style={{ marginTop: "10px" }}>
              {parCouleur.get(domaineActif)!.evts.map(e => (
                <a key={e.id} href={`/evenement/${e.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.06)", borderLeft: `3px solid ${e.couleur || "#2B7FFF"}`, borderRadius: "8px", padding: "8px 10px", marginBottom: "5px" }}>
                    <span style={{ fontSize: "12px", color: "#fff" }}>{e.titre}</span>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{e.heure}{e.duree ? ` · ${formatDuree(e.duree)}` : ""}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
