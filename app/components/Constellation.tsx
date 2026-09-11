"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"

type Evt = {
  id: string; titre: string; heure?: string; couleur?: string; duree?: number
  _occId?: string; date?: string; lat?: number | null; lng?: number | null
}

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
const VITESSE_TRANSPORT_KMH = 20 // transports en commun

function formatDuree(min: number) {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60), m = Math.round(min % 60)
  return m ? `${h}h${m}` : `${h}h`
}

function fr(n: number, decimales = 1) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: decimales, minimumFractionDigits: 0 })
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function jourDe(e: Evt) {
  if (e._occId) return e._occId.split("-").slice(-3).join("-")
  return e.date || ""
}

function calculerTrajets(evts: Evt[]) {
  const parJour = new Map<string, Evt[]>()
  evts.forEach(e => {
    const j = jourDe(e)
    if (!j) return
    if (!parJour.has(j)) parJour.set(j, [])
    parJour.get(j)!.push(e)
  })
  let totalMin = 0
  const segments: { de: Evt; a: Evt; km: number; min: number; jour: string }[] = []
  const joursTries = Array.from(parJour.keys()).sort()
  joursTries.forEach(j => {
    const liste = parJour.get(j)!
    const avecLieu = liste.filter(e => e.lat != null && e.lng != null && e.heure)
      .sort((a, b) => (a.heure! < b.heure! ? -1 : a.heure! > b.heure! ? 1 : 0))
    for (let i = 0; i < avecLieu.length - 1; i++) {
      const a = avecLieu[i], b = avecLieu[i + 1]
      const km = distanceKm(a.lat!, a.lng!, b.lat!, b.lng!)
      const min = Math.round((km / VITESSE_TRANSPORT_KMH) * 60)
      totalMin += min
      segments.push({ de: a, a: b, km, min, jour: j })
    }
  })
  return { totalMin, segments }
}

type Star = { x: number; y: number; z: number }

export default function Constellation({ evenements, periodeLabel = "cette semaine" }: { evenements: Evt[]; periodeLabel?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selected, setSelected] = useState<Evt | null>(null)
  const [domaineActif, setDomaineActif] = useState<string | null>(null)
  const [modeEdition, setModeEdition] = useState(false)
  const [voirTrajets, setVoirTrajets] = useState(false)
  const [plein, setPlein] = useState(false)
  const [noms, setNoms] = useState<Record<string, string>>(NOMS_PAR_DEFAUT)
  const stateRef = useRef({ rx: 0.4, ry: 0.6, dragging: false, lastX: 0, lastY: 0, vitesse: 2, cibleVitesse: 2 })
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const starsRef = useRef<Star[]>([])
  const rafRef = useRef<number | null>(null)

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
    if (!user) { console.error("Renommage impossible : utilisateur non connecté"); return }
    const { error } = await supabase.from("domaines_couleur").upsert({ user_id: user.id, couleur, nom }, { onConflict: "user_id,couleur" })
    if (error) console.error("Erreur d'enregistrement du renommage :", error.message)
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
  const trajets = calculerTrajets(evenements)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rectInitial = canvas.getBoundingClientRect()
    canvas.width = Math.max(280, Math.round(rectInitial.width))
    canvas.height = plein ? Math.max(400, Math.round(rectInitial.height)) : 320

    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const st = stateRef.current
    const n = Math.max(evenements.length, 1)
    const dureeMax = Math.max(...evenements.map(e => e.duree || 30), 30)
    const afficherLiens = evenements.length <= 60

    function nouvelleEtoile(zInit?: number): Star {
      return { x: (Math.random() - 0.5) * W, y: (Math.random() - 0.5) * H, z: zInit ?? Math.random() * W }
    }
    starsRef.current = Array.from({ length: 140 }, () => nouvelleEtoile())

    const pts = evenements.map((e, i) => {
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
      ctx!.fillStyle = "#060a16"
      ctx!.fillRect(0, 0, W, H)
      const neb = ctx!.createRadialGradient(W * 0.3, H * 0.25, 0, W * 0.3, H * 0.25, W * 0.7)
      neb.addColorStop(0, "rgba(90,60,180,0.13)")
      neb.addColorStop(1, "rgba(90,60,180,0)")
      ctx!.fillStyle = neb
      ctx!.fillRect(0, 0, W, H)

      // vol dans les étoiles
      st.vitesse += (st.cibleVitesse - st.vitesse) * 0.08
      starsRef.current.forEach(s => {
        const prevZ = s.z
        s.z -= st.vitesse
        if (s.z <= 1) { Object.assign(s, nouvelleEtoile(W)); return }
        const sx = cx + (s.x / s.z) * W * 0.5
        const sy = cy + (s.y / s.z) * W * 0.5
        if (sx < 0 || sx > W || sy < 0 || sy > H) return
        const pSx = cx + (s.x / prevZ) * W * 0.5
        const pSy = cy + (s.y / prevZ) * W * 0.5
        const taille = (1 - s.z / W) * 2.4
        const alpha = Math.min(1, (1 - s.z / W) * 1.1)
        ctx!.strokeStyle = `rgba(255,255,255,${alpha})`
        ctx!.lineWidth = taille
        ctx!.beginPath()
        ctx!.moveTo(pSx, pSy)
        ctx!.lineTo(sx, sy)
        ctx!.stroke()
      })

      const rayonBase = Math.min(W, H) * (0.34 + Math.min(n, 300) / 300 * 0.20)
      const R = rayonBase

      const projected = pts.map(p => {
        const r = rotated(p)
        return { sx: cx + r.x * R, sy: cy + r.y * R, z: r.z, e: p.e }
      })
      projected.sort((a, b) => a.z - b.z)

      if (afficherLiens && !voirTrajets) {
        for (let i = 0; i < projected.length; i++) {
          for (let j = i + 1; j < projected.length; j++) {
            ctx!.strokeStyle = "rgba(120,150,255,0.12)"
            ctx!.lineWidth = 0.5
            ctx!.beginPath()
            ctx!.moveTo(projected[i].sx, projected[i].sy)
            ctx!.lineTo(projected[j].sx, projected[j].sy)
            ctx!.stroke()
          }
        }
      }

      if (voirTrajets) {
        trajets.segments.forEach(seg => {
          const iDe = pts.findIndex(p => p.e === seg.de)
          const iA = pts.findIndex(p => p.e === seg.a)
          if (iDe === -1 || iA === -1) return
          const pDe = projected.find((_, idx) => idx === iDe)
          const pA = projected.find((_, idx) => idx === iA)
          if (!pDe || !pA) return
          const intensite = Math.min(1, seg.km / 15)
          ctx!.strokeStyle = `rgba(255,${Math.round(170 - intensite * 100)},80,${0.35 + intensite * 0.45})`
          ctx!.lineWidth = 1 + intensite * 2.5
          ctx!.beginPath()
          ctx!.moveTo(pDe.sx, pDe.sy)
          ctx!.lineTo(pA.sx, pA.sy)
          ctx!.stroke()
        })
      }

      projected.forEach(p => {
        const dureeRatio = (p.e.duree || 30) / dureeMax
        const size = (2.5 + dureeRatio * (plein ? 7 : 5)) + (p.z + 1) * 1.5
        const estActif = !domaineActif || p.e.couleur === domaineActif
        const couleur = p.e.couleur || "#2B7FFF"

        if (estActif) {
          const halo = ctx!.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, size * 3.2)
          halo.addColorStop(0, couleur + "55")
          halo.addColorStop(1, couleur + "00")
          ctx!.beginPath()
          ctx!.arc(p.sx, p.sy, size * 3.2, 0, Math.PI * 2)
          ctx!.fillStyle = halo
          ctx!.fill()
        }

        ctx!.beginPath()
        ctx!.arc(p.sx, p.sy, size, 0, Math.PI * 2)
        ctx!.fillStyle = couleur
        ctx!.globalAlpha = estActif ? (0.65 + (p.z + 1) * 0.2) : 0.07
        ctx!.fill()
        ctx!.globalAlpha = 1
      })
    }

    function loop() {
      if (!st.dragging) st.ry += 0.0012
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    function scaleCoords(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect()
      return { x: (clientX - rect.left) * (W / rect.width), y: (clientY - rect.top) * (H / rect.height) }
    }

    function pointerDown(x: number, y: number) { st.dragging = true; st.lastX = x; st.lastY = y; canvas!.style.cursor = "grabbing" }
    function pointerMove(x: number, y: number) {
      if (!st.dragging) return
      st.ry += (x - st.lastX) * 0.01
      st.rx += (y - st.lastY) * 0.01
      st.lastX = x; st.lastY = y
    }
    function pointerUp() { st.dragging = false; if (canvas) canvas.style.cursor = "grab" }

    function onClick(e: MouseEvent) {
      if (domaineActif) return
      const { x, y } = scaleCoords(e.clientX, e.clientY)
      const rayonBase = Math.min(W, H) * (0.34 + Math.min(n, 300) / 300 * 0.20)
      let best: Evt | null = null, bestD = 22
      pts.forEach(p => {
        const r = rotated(p)
        const sx = cx + r.x * rayonBase, sy = cy + r.y * rayonBase
        const d = Math.hypot(x - sx, y - sy)
        if (d < bestD) { bestD = d; best = p.e }
      })
      if (best) setSelected(best)
    }

    const onDown = (e: MouseEvent) => { const c = scaleCoords(e.clientX, e.clientY); pointerDown(c.x, c.y) }
    const onMove = (e: MouseEvent) => { const c = scaleCoords(e.clientX, e.clientY); pointerMove(c.x, c.y) }
    const onUp = () => pointerUp()
    const onTouchStart = (e: TouchEvent) => { if (e.touches.length === 1) { const t = e.touches[0]; const c = scaleCoords(t.clientX, t.clientY); pointerDown(c.x, c.y) } }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0]; const c = scaleCoords(t.clientX, t.clientY); pointerMove(c.x, c.y); e.preventDefault()
      } else if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const d = Math.hypot(dx, dy)
        const prev = (canvas as any)._pinchDist
        if (prev != null) st.cibleVitesse = Math.max(1, Math.min(14, st.cibleVitesse + (d - prev) * 0.05))
        ;(canvas as any)._pinchDist = d
      }
    }
    const onTouchEnd = () => { pointerUp(); (canvas as any)._pinchDist = null }
    const onWheel = (e: WheelEvent) => { e.preventDefault(); st.cibleVitesse = Math.max(1, Math.min(14, st.cibleVitesse - e.deltaY * 0.03)) }

    canvas.addEventListener("mousedown", onDown)
    canvas.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    canvas.addEventListener("touchstart", onTouchStart)
    canvas.addEventListener("touchmove", onTouchMove, { passive: false })
    canvas.addEventListener("touchend", onTouchEnd)
    canvas.addEventListener("click", onClick)
    canvas.addEventListener("wheel", onWheel, { passive: false })

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      canvas.removeEventListener("mousedown", onDown)
      canvas.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      canvas.removeEventListener("touchstart", onTouchStart)
      canvas.removeEventListener("touchmove", onTouchMove)
      canvas.removeEventListener("touchend", onTouchEnd)
      canvas.removeEventListener("click", onClick)
      canvas.removeEventListener("wheel", onWheel)
    }
  }, [evenements, domaineActif, plein, voirTrajets])

  const contenu = (
    <>
      <div style={{ position: "relative" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: plein ? "70vh" : "300px", display: "block", cursor: "grab", touchAction: "none", borderRadius: "12px" }} />
        <button onClick={() => setPlein(v => !v)} aria-label={plein ? "Fermer le plein écran" : "Plein écran"}
          style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "8px", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          {plein ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
          )}
        </button>
        <div style={{ position: "absolute", bottom: "8px", left: "8px", fontSize: "9px", color: "rgba(255,255,255,0.35)" }}>molette / pince pour zoomer</div>
      </div>

      <div style={{ minHeight: "16px", margin: "8px 0 10px", textAlign: "center" }}>
        {selected && !domaineActif && (
          <a href={`/evenement/${selected.id}`} style={{ fontSize: "13px", color: "#fff", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: selected.couleur || "#2B7FFF", flexShrink: 0 }}></span>
            {selected.titre}{selected.heure ? ` · ${selected.heure}` : ""}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </a>
        )}
        {!selected && !domaineActif && !voirTrajets && (
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Fais glisser pour tourner, touche un point ou un domaine</span>
        )}
        {domaineActif && (() => {
          const stats = parCouleur.get(domaineActif)
          const total = stats?.total || 0
          return (
            <div>
              <div style={{ fontSize: "13px", color: "#fff", marginBottom: "6px" }}>
                {nomDomaine(domaineActif)} {periodeLabel} · {stats?.count} événement{(stats?.count || 0) > 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                {[
                  { label: "minutes", val: fr(total, 0) },
                  { label: "heures", val: fr(total / 60, 1) },
                  { label: "jours", val: fr(total / 1440, 2) },
                  { label: "semaines", val: fr(total / 10080, 2) },
                ].map(u => (
                  <div key={u.label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "10px", padding: "6px 10px", minWidth: "56px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>{u.val}</div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{u.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
        {voirTrajets && !domaineActif && (
          <div>
            <div style={{ fontSize: "13px", color: "#fff", marginBottom: "4px" }}>
              <strong style={{ fontWeight: 600 }}>{formatDuree(trajets.totalMin)}</strong> de trajet estimé {periodeLabel}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Estimation à vol d'oiseau · transports en commun (~{VITESSE_TRANSPORT_KMH}km/h)</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "0.5px solid rgba(255,255,255,0.15)", paddingTop: "10px", marginBottom: (modeEdition || voirTrajets) ? "8px" : "0", flexWrap: "wrap", gap: "6px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", flex: 1 }}>
          {!modeEdition && !voirTrajets && domaines.map(([couleur]) => (
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
        <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
          {trajets.segments.length > 0 && (
            <button onClick={() => { setVoirTrajets(v => !v); setDomaineActif(null); setModeEdition(false) }} style={{ background: "none", border: "none", color: voirTrajets ? "#FFA34F" : "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {voirTrajets ? "Fermer" : "Trajets"}
            </button>
          )}
          <button onClick={() => { setModeEdition(v => !v); setDomaineActif(null); setVoirTrajets(false) }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            {modeEdition ? "Terminé" : "Renommer"}
          </button>
        </div>
      </div>

      {modeEdition && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {COULEURS_CONNUES.map(couleur => (
            <div key={couleur} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: couleur, flexShrink: 0 }}></span>
              <input
                value={noms[couleur] || ""}
                onChange={e => {
                  const valeur = e.target.value
                  setNoms(prev => ({ ...prev, [couleur]: valeur }))
                  renommer(couleur, valeur)
                }}
                placeholder="Nom du domaine"
                style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "6px 10px", fontSize: "12px", color: "#fff", outline: "none" }}
              />
            </div>
          ))}
        </div>
      )}

      {voirTrajets && (
        <div style={{ marginTop: "4px", maxHeight: plein ? "22vh" : "none", overflowY: plein ? "auto" : "visible" }}>
          {trajets.segments.length === 0 ? (
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "12px 0" }}>
              Ajoute des lieux à tes événements pour voir tes trajets estimés
            </div>
          ) : (() => {
            const parJour = new Map<string, typeof trajets.segments>()
            trajets.segments.forEach(seg => {
              if (!parJour.has(seg.jour)) parJour.set(seg.jour, [])
              parJour.get(seg.jour)!.push(seg)
            })
            return Array.from(parJour.entries()).map(([jour, segs]) => {
              const dateObj = new Date(jour + "T00:00:00")
              const label = dateObj.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
              return (
                <div key={jour} style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "5px" }}>{label}</div>
                  {segs.map((seg, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.06)", borderLeft: "3px solid #FFA34F", borderRadius: "8px", padding: "8px 10px", marginBottom: "5px" }}>
                      <span style={{ fontSize: "12px", color: "#fff" }}>{seg.de.titre} <span style={{ color: "rgba(255,255,255,0.4)" }}>({seg.de.heure})</span> → {seg.a.titre} <span style={{ color: "rgba(255,255,255,0.4)" }}>({seg.a.heure})</span></span>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", flexShrink: 0, marginLeft: "8px" }}>{fr(seg.km, 1)} km · {formatDuree(seg.min)}</span>
                    </div>
                  ))}
                </div>
              )
            })
          })()}
        </div>
      )}

      {domaineActif && !modeEdition && !voirTrajets && (
        <div style={{ marginTop: "10px", maxHeight: plein ? "22vh" : "none", overflowY: plein ? "auto" : "visible" }}>
          {parCouleur.get(domaineActif)!.evts.map(e => (
            <a key={e._occId || e.id} href={`/evenement/${e.id}`} style={{ textDecoration: "none", display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.06)", borderLeft: `3px solid ${e.couleur || "#2B7FFF"}`, borderRadius: "8px", padding: "8px 10px", marginBottom: "5px" }}>
                <span style={{ fontSize: "12px", color: "#fff" }}>{e.titre}</span>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{e.heure}{e.duree ? ` · ${formatDuree(e.duree)}` : ""}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  )

  if (evenements.length === 0) {
    return (
      <div style={{ background: "linear-gradient(160deg,#0A1628,#1a3a6e)", borderRadius: "16px", padding: "12px", border: "0.5px solid #DCE9FF" }}>
        <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
          Aucun événement à afficher
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: "linear-gradient(160deg,#0A1628,#1a3a6e)", borderRadius: "16px", padding: "12px", border: "0.5px solid #DCE9FF" }}>
      {contenu}
    </div>
  )
}
