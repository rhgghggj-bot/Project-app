"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"

const OLLAMA_URL = "http://localhost:11434/api/chat"
const WHISPER_URL = "http://localhost:5005/transcrire"
const MODEL = "llama3.1:8b"
const CLAUDE_URL = "https://api.anthropic.com/v1/messages"
const CLAUDE_MODEL = "claude-sonnet-5"
const SYSTEM_PROMPT = `Tu es Jarvis, l'assistant IA personnel de Pierre.

Règles strictes de comportement :
- Tu t'adresses TOUJOURS à Pierre directement en le tutoyant ("tu as", "ton rendez-vous"...). Ne parle JAMAIS de lui à la 3e personne ("Pierre a", "son calendrier").
- Réponds en français correct et naturel, jamais de tournures bancales. Relis-toi mentalement avant de répondre.
- Reste concis et conversationnel, comme à l'oral. Ne liste jamais tous les événements/dépenses en vrac sauf si Pierre te le demande explicitement.
- Si Pierre corrige, reformule ou clarifie ta réponse précédente, fais-le simplement à partir de ce que tu as déjà dit — NE RECONSULTE PAS un outil pour ça, tu as déjà l'information.
- N'utilise un outil que pour une VRAIE nouvelle question sur ses données (calendrier, finances, groupes). Une seule consultation suffit, n'en fais pas plus que nécessaire.
- N'écris JAMAIS en markdown (pas d'astérisques **, pas de tirets de liste, pas de titres #). Écris en texte simple, comme une vraie conversation orale, car tes réponses sont aussi lues à voix haute par une synthèse vocale.
- N'utilise JAMAIS d'emojis dans tes réponses.
- TU PEUX CRÉER DES IMAGES via l'outil generer_image. Ne dis JAMAIS que tu ne peux pas créer d'images — c'est faux, tu en es capable. Dès que Pierre demande une image, un dessin ou une illustration, appelle immédiatement l'outil generer_image avec une description en anglais, sans jamais refuser ni renvoyer vers un autre outil.
- Toutes tes réponses restent strictement locales sur la machine de Pierre, rien ne sort jamais de son Mac.`

const IMAGEGEN_URL = "http://localhost:5007/generer"

const OUTILS = [
  {
    type: "function",
    function: {
      name: "generer_image",
      description: "Génère une image à partir d'une description textuelle. Utilise-la quand Pierre demande de créer, dessiner ou générer une image.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "La description détaillée de l'image à générer, en anglais de préférence pour de meilleurs résultats" }
        },
        required: ["prompt"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "obtenir_evenements",
      description: "Récupère les événements du calendrier de l'utilisateur pour une période donnée",
      parameters: {
        type: "object",
        properties: {
          periode: { type: "string", enum: ["aujourdhui", "semaine", "mois"], description: "La période à consulter" }
        },
        required: ["periode"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "obtenir_finances",
      description: "Récupère un résumé des dépenses et revenus de l'utilisateur pour une période donnée",
      parameters: {
        type: "object",
        properties: {
          periode: { type: "string", enum: ["mois", "annee", "tout"], description: "La période à consulter" }
        },
        required: ["periode"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "obtenir_groupes",
      description: "Récupère la liste des groupes dont l'utilisateur fait partie",
      parameters: { type: "object", properties: {} }
    }
  }
]

const OUTILS_CLAUDE = [
  { type: "web_search_20250305", name: "web_search", max_uses: 5 },
  {
    name: "generer_image",
    description: "Génère une image à partir d'une description textuelle. Utilise-la quand Pierre demande de créer, dessiner ou générer une image.",
    input_schema: {
      type: "object",
      properties: { prompt: { type: "string", description: "La description détaillée de l'image à générer, en anglais de préférence pour de meilleurs résultats" } },
      required: ["prompt"]
    }
  },
  {
    name: "obtenir_evenements",
    description: "Récupère les événements du calendrier de l'utilisateur pour une période donnée",
    input_schema: {
      type: "object",
      properties: { periode: { type: "string", enum: ["aujourdhui", "semaine", "mois"], description: "La période à consulter" } },
      required: ["periode"]
    }
  },
  {
    name: "obtenir_finances",
    description: "Récupère un résumé des dépenses et revenus de l'utilisateur pour une période donnée",
    input_schema: {
      type: "object",
      properties: { periode: { type: "string", enum: ["mois", "annee", "tout"], description: "La période à consulter" } },
      required: ["periode"]
    }
  },
  {
    name: "obtenir_groupes",
    description: "Récupère la liste des groupes dont l'utilisateur fait partie",
    input_schema: { type: "object", properties: {} }
  }
]

type Msg = { role: "system" | "user" | "assistant"; content: string }

export default function Jarvis() {
  const [historique, setHistorique] = useState<Msg[]>([{ role: "system", content: SYSTEM_PROMPT }])
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; texte: string; erreur?: boolean; image?: string }[]>([
    { role: "assistant", texte: "Bonjour Pierre. Jarvis est en ligne, en local, sur ton Mac. Comment puis-je t'aider ?" }
  ])
  const [input, setInput] = useState("")
  const [reflechit, setReflechit] = useState(false)
  const [modeVocal, setModeVocal] = useState(false)
  const [ecoute, setEcoute] = useState(false)
  const [transcription, setTranscription] = useState(false)
  const [parlant, setParlant] = useState(false)
  const [voixActive, setVoixActive] = useState(true)
  const [voixDisponibles, setVoixDisponibles] = useState<SpeechSynthesisVoice[]>([])
  const [voixChoisie, setVoixChoisie] = useState<string>("")
  const [documentJoint, setDocumentJoint] = useState<{ nom: string; contenu: string } | null>(null)
  const fichierInputRef = useRef<HTMLInputElement>(null)
  const [modeCloud, setModeCloud] = useState(false)
  const [claudeKey, setClaudeKey] = useState("")
  const [montrerConfigCloud, setMontrerConfigCloud] = useState(false)
  const [historiqueCloud, setHistoriqueCloud] = useState<any[]>([])
  const [statut, setStatut] = useState<{ texte: string; ok: boolean | null }>({ texte: "Connexion à Ollama...", ok: null })
  const chatRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fondCanvasRef = useRef<HTMLCanvasElement>(null)
  const angleRef = useRef({ a: 0, a2: 0 })
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const imageGenereeRef = useRef<string | null>(null)
  const etincellesRef = useRef<{ theta: number; phi: number; vitesse: number; vie: number }[]>([])
  const pointsGlobeRef = useRef<{ theta: number; phi: number }[]>([])
  const reflechitRef = useRef(false)
  const parlantRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const vadRafRef = useRef<number | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enregistrementActifRef = useRef(false)

  useEffect(() => { reflechitRef.current = reflechit }, [reflechit])
  useEffect(() => { parlantRef.current = parlant }, [parlant])

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
    const sauvegardee = localStorage.getItem("jarvis_claude_key")
    if (sauvegardee) setClaudeKey(sauvegardee)
  }, [])

  useEffect(() => {
    if (!("speechSynthesis" in window)) return
    function chargerVoix() {
      const toutes = window.speechSynthesis.getVoices()
      const francaises = toutes.filter(v => v.lang.startsWith("fr"))
      setVoixDisponibles(francaises.length > 0 ? francaises : toutes)
      const sauvegardee = localStorage.getItem("jarvis_voix")
      setVoixChoisie(prev => {
        if (prev) return prev
        if (sauvegardee && (francaises.length > 0 ? francaises : toutes).some(v => v.voiceURI === sauvegardee)) return sauvegardee
        return (francaises[0] || toutes[0])?.voiceURI || ""
      })
    }
    chargerVoix()
    window.speechSynthesis.addEventListener("voiceschanged", chargerVoix)
    return () => window.speechSynthesis.removeEventListener("voiceschanged", chargerVoix)
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
      etincellesRef.current = Array.from({ length: 36 }, () => ({
        theta: Math.random() * Math.PI * 2, phi: Math.acos(1 - 2 * Math.random()),
        vitesse: 0.3 + Math.random() * 0.5, vie: Math.random()
      }))
    }
    if (pointsGlobeRef.current.length === 0) {
      const N = 60
      pointsGlobeRef.current = Array.from({ length: N }, (_, i) => {
        const phi = Math.acos(1 - 2 * (i + 0.5) / N)
        const theta = Math.PI * (1 + Math.sqrt(5)) * i
        return { theta, phi }
      })
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
      const actif = reflechitRef.current || parlantRef.current
      gctx!.clearRect(0, 0, GW, GH)
      const echelle = GW / 112
      const baseR = 34 * echelle
      const pulse = actif ? 1 + Math.sin(Date.now() / 140) * 0.05 : 1 + Math.sin(Date.now() / 900) * 0.015
      const R = baseR * pulse
      const intensite = actif ? 1 : 0.55
      const vitRot = actif ? 0.014 : 0.005

      angleRef.current.a += vitRot
      angleRef.current.a2 += vitRot * 0.6
      const { a, a2 } = angleRef.current

      const projetes = pointsGlobeRef.current.map(pt => {
        const p = rotateGlobe(point3D(pt.theta, pt.phi, R), a, a2)
        return { sx: gcx + p.x, sy: gcy + p.y, z: p.z }
      })

      for (let i = 0; i < projetes.length; i++) {
        for (let j = i + 1; j < projetes.length; j++) {
          const dx = projetes[i].sx - projetes[j].sx, dy = projetes[i].sy - projetes[j].sy
          const dist = Math.hypot(dx, dy)
          if (dist < R * 0.85) {
            gctx!.beginPath()
            gctx!.moveTo(projetes[i].sx, projetes[i].sy)
            gctx!.lineTo(projetes[j].sx, projetes[j].sy)
            const zMoy = (projetes[i].z + projetes[j].z) / 2
            const depthAlpha = 0.08 + Math.max(0, (zMoy + R) / (2 * R)) * 0.22
            gctx!.strokeStyle = `rgba(255,178,60,${depthAlpha * intensite})`
            gctx!.lineWidth = 0.5 * echelle
            gctx!.stroke()
          }
        }
      }

      projetes.sort((x, y) => x.z - y.z)
      projetes.forEach(p => {
        const tailleBase = (1 + (p.z / R + 1) * 0.7) * echelle
        const eclat = 0.5 + (p.z / R + 1) * 0.25
        const haloPt = gctx!.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, tailleBase * 2.2)
        haloPt.addColorStop(0, `rgba(255,210,140,${eclat * 0.28 * intensite})`)
        haloPt.addColorStop(1, "rgba(255,210,140,0)")
        gctx!.beginPath()
        gctx!.arc(p.sx, p.sy, tailleBase * 2.2, 0, Math.PI * 2)
        gctx!.fillStyle = haloPt
        gctx!.fill()

        gctx!.beginPath()
        gctx!.arc(p.sx, p.sy, tailleBase, 0, Math.PI * 2)
        gctx!.fillStyle = `rgba(255,225,170,${eclat * intensite})`
        gctx!.fill()
      })

      etincellesRef.current.forEach(e => {
        e.vie += 0.006 * e.vitesse * (actif ? 2.2 : 1)
        if (e.vie > 1) { e.vie = 0; e.theta = Math.random() * Math.PI * 2; e.phi = Math.acos(1 - 2 * Math.random()) }
        const r = R * (0.55 + e.vie * 0.9)
        const p = rotateGlobe(point3D(e.theta, e.phi, r), a, a2)
        const sx = gcx + p.x, sy = gcy + p.y
        const alpha = (1 - e.vie) * intensite
        gctx!.beginPath()
        gctx!.arc(sx, sy, 1.1 * echelle, 0, Math.PI * 2)
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

      const noyau = gctx!.createRadialGradient(gcx, gcy, 0, gcx, gcy, 6 * echelle * pulse)
      noyau.addColorStop(0, `rgba(255,240,210,${0.9 * intensite})`)
      noyau.addColorStop(1, "rgba(255,200,110,0)")
      gctx!.beginPath()
      gctx!.arc(gcx, gcy, 6 * echelle * pulse, 0, Math.PI * 2)
      gctx!.fillStyle = noyau
      gctx!.fill()

      raf = requestAnimationFrame(dessiner)
    }
    dessiner()
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const canvas = fondCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let raf: number
    let W = 0, H = 0

    function redimensionner() {
      W = canvas!.width = window.innerWidth
      H = canvas!.height = window.innerHeight
    }
    redimensionner()
    window.addEventListener("resize", redimensionner)

    const etoiles = Array.from({ length: 110 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.1 + 0.3, phase: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.00025, vy: (Math.random() - 0.5) * 0.00025 + 0.00012
    }))

    function dessiner(t: number) {
      ctx!.clearRect(0, 0, W, H)
      const neb1 = ctx!.createRadialGradient(W * 0.15, H * 0.1, 0, W * 0.15, H * 0.1, W * 0.6)
      neb1.addColorStop(0, "rgba(255,150,40,0.05)")
      neb1.addColorStop(1, "rgba(255,150,40,0)")
      ctx!.fillStyle = neb1
      ctx!.fillRect(0, 0, W, H)
      const neb2 = ctx!.createRadialGradient(W * 0.85, H * 0.9, 0, W * 0.85, H * 0.9, W * 0.6)
      neb2.addColorStop(0, "rgba(90,60,180,0.06)")
      neb2.addColorStop(1, "rgba(90,60,180,0)")
      ctx!.fillStyle = neb2
      ctx!.fillRect(0, 0, W, H)

      etoiles.forEach(s => {
        s.x += s.vx
        s.y += s.vy
        if (s.x < 0) s.x += 1; if (s.x > 1) s.x -= 1
        if (s.y < 0) s.y += 1; if (s.y > 1) s.y -= 1
        const scintille = 0.25 + Math.sin(t / 1100 + s.phase) * 0.2 + 0.2
        ctx!.beginPath()
        ctx!.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255,255,255,${Math.max(0, scintille)})`
        ctx!.fill()
      })
      raf = requestAnimationFrame(dessiner)
    }
    raf = requestAnimationFrame(dessiner)

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", redimensionner) }
  }, [])

  function fichierSelectionne(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0]
    if (!fichier) return
    const lecteur = new FileReader()
    lecteur.onload = () => {
      let contenu = String(lecteur.result || "")
      const LIMITE = 12000
      if (contenu.length > LIMITE) contenu = contenu.slice(0, LIMITE) + "\n\n[... document tronqué, trop long ...]"
      setDocumentJoint({ nom: fichier.name, contenu })
    }
    lecteur.readAsText(fichier)
    e.target.value = ""
  }

  function parler(texte: string) {
    if (!voixActive || !("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(texte)
    const voix = voixDisponibles.find(v => v.voiceURI === voixChoisie)
    if (voix) utterance.voice = voix
    utterance.lang = "fr-FR"
    utterance.rate = 1.02
    utterance.onstart = () => setParlant(true)
    utterance.onend = () => setParlant(false)
    utterance.onerror = () => setParlant(false)
    window.speechSynthesis.speak(utterance)
  }

  function demarrerEnregistrementAuto() {
    if (!streamRef.current || enregistrementActifRef.current) return
    const recorder = new MediaRecorder(streamRef.current)
    chunksRef.current = []
    recorder.ondataavailable = e => chunksRef.current.push(e.data)
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" })
      if (blob.size < 2000) { setTranscription(false); return }
      setTranscription(true)
      try {
        const formData = new FormData()
        formData.append("audio", blob, "audio.webm")
        const res = await fetch(WHISPER_URL, { method: "POST", body: formData })
        const data = await res.json()
        if (data.texte && data.texte.trim()) envoyer(data.texte.trim())
      } catch {
        setStatut({ texte: "Whisper non détecté — lance whisper_server.py", ok: false })
      }
      setTranscription(false)
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    enregistrementActifRef.current = true
    setEcoute(true)
  }

  function arreterEnregistrementAuto() {
    if (!enregistrementActifRef.current) return
    mediaRecorderRef.current?.stop()
    enregistrementActifRef.current = false
    setEcoute(false)
  }

  useEffect(() => {
    if (!modeVocal) {
      if (vadRafRef.current) cancelAnimationFrame(vadRafRef.current)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      if (enregistrementActifRef.current) arreterEnregistrementAuto()
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      audioCtxRef.current?.close().catch(() => {})
      audioCtxRef.current = null
      return
    }

    let annule = false
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      if (annule) { stream.getTracks().forEach(t => t.stop()); return }
      streamRef.current = stream
      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      analyserRef.current = analyser
      const dataArray = new Uint8Array(analyser.fftSize)
      const SEUIL = 0.025
      const SILENCE_MS = 900

      function boucle() {
        if (!analyserRef.current) return
        analyserRef.current.getByteTimeDomainData(dataArray)
        let somme = 0
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128
          somme += v * v
        }
        const volume = Math.sqrt(somme / dataArray.length)
        const enPause = reflechitRef.current || parlantRef.current

        if (!enPause && volume > SEUIL) {
          if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
          if (!enregistrementActifRef.current) demarrerEnregistrementAuto()
        } else if (enregistrementActifRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            silenceTimerRef.current = null
            arreterEnregistrementAuto()
          }, SILENCE_MS)
        }

        vadRafRef.current = requestAnimationFrame(boucle)
      }
      boucle()
    }).catch(() => {
      setStatut({ texte: "Micro refusé — autorise-le dans les réglages du navigateur", ok: false })
      setModeVocal(false)
    })

    return () => { annule = true }
  }, [modeVocal])

  async function executerOutil(nom: string, args: any) {
    if (nom === "generer_image") {
      try {
        const res = await fetch(IMAGEGEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: args.prompt })
        })
        const data = await res.json()
        if (data.image) {
          imageGenereeRef.current = data.image
          return { succes: true, message: "Image générée avec succès, elle s'affiche à l'utilisateur." }
        }
        return { erreur: data.erreur || "Échec de la génération" }
      } catch {
        return { erreur: "Serveur de génération d'images non détecté — lance imagegen_server.py" }
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { erreur: "Utilisateur non connecté" }

    if (nom === "obtenir_evenements") {
      const debut = new Date()
      const fin = new Date()
      if (args.periode === "semaine") fin.setDate(fin.getDate() + 7)
      else if (args.periode === "mois") fin.setMonth(fin.getMonth() + 1)
      const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const { data } = await supabase.from("evenements_calendrier").select("titre,date,heure,duree,lieu")
        .eq("user_id", user.id).gte("date", fmt(debut)).lte("date", fmt(fin)).order("date").limit(15)
      return { evenements: data || [] }
    }

    if (nom === "obtenir_finances") {
      const debut = new Date()
      if (args.periode === "mois") debut.setDate(1)
      else if (args.periode === "annee") { debut.setMonth(0); debut.setDate(1) }
      else debut.setFullYear(2000)
      const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const { data: depenses } = await supabase.from("depenses").select("titre,montant,categorie,date").eq("user_id", user.id).gte("date", fmt(debut))
      const { data: revenus } = await supabase.from("revenus").select("titre,montant,categorie,date").eq("user_id", user.id).gte("date", fmt(debut))
      const totalDepenses = (depenses || []).reduce((s, d) => s + (d.montant || 0), 0)
      const totalRevenus = (revenus || []).reduce((s, r) => s + (r.montant || 0), 0)
      return { totalDepenses, totalRevenus, solde: totalRevenus - totalDepenses, depenses: depenses || [], revenus: revenus || [] }
    }

    if (nom === "obtenir_groupes") {
      const { data: membres } = await supabase.from("membres_groupe").select("groupe_id").eq("user_id", user.id)
      const ids = (membres || []).map((m: any) => m.groupe_id)
      if (ids.length === 0) return { groupes: [] }
      const { data } = await supabase.from("groupes").select("nom,description").in("id", ids)
      return { groupes: data || [] }
    }

    return { erreur: "Outil inconnu" }
  }

  async function envoyerCloud(texte: string) {
    imageGenereeRef.current = null
    const texteEnvoye = documentJoint
      ? `[Document joint : "${documentJoint.nom}"]\n\n${documentJoint.contenu}\n\n---\n\nQuestion de Pierre : ${texte}`
      : texte
    let messagesActuels: any[] = [...historiqueCloud, { role: "user", content: texteEnvoye }]
    setHistoriqueCloud(messagesActuels)
    setMessages(prev => [...prev, { role: "user", texte }, { role: "assistant", texte: "Jarvis (cloud) réfléchit..." }])

    try {
      let reponseFinaleTexte = ""
      let boucles = 0
      while (boucles < 4) {
        boucles++
        const res = await fetch(CLAUDE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": claudeKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body: JSON.stringify({
            model: CLAUDE_MODEL,
            max_tokens: 1024,
            system: SYSTEM_PROMPT + " Tu as aussi accès à un outil de recherche web — utilise-le dès qu'une question porte sur l'actualité, des faits récents ou toute info qui pourrait avoir changé depuis ta formation. Cite tes sources brièvement.",
            messages: messagesActuels,
            tools: OUTILS_CLAUDE
          })
        })
        if (!res.ok) {
          const texteErreur = await res.text()
          throw new Error(texteErreur)
        }
        const data = await res.json()
        const contenu = data.content || []
        const toolUses = contenu.filter((b: any) => b.type === "tool_use")
        const texteBlocs = contenu.filter((b: any) => b.type === "text").map((b: any) => b.text).join("")

        if (toolUses.length > 0) {
          messagesActuels = [...messagesActuels, { role: "assistant", content: contenu }]
          setMessages(prev => {
            const copie = [...prev]
            copie[copie.length - 1] = { role: "assistant", texte: "Jarvis consulte tes données..." }
            return copie
          })
          const resultats = []
          for (const tu of toolUses) {
            const resultat = await executerOutil(tu.name, tu.input || {})
            resultats.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(resultat) })
          }
          messagesActuels = [...messagesActuels, { role: "user", content: resultats }]
          continue
        } else {
          reponseFinaleTexte = texteBlocs
          messagesActuels = [...messagesActuels, { role: "assistant", content: contenu }]
          break
        }
      }
      setMessages(prev => {
        const copie = [...prev]
        copie[copie.length - 1] = { role: "assistant", texte: reponseFinaleTexte, image: imageGenereeRef.current || undefined }
        return copie
      })
      setHistoriqueCloud(messagesActuels)
      parler(reponseFinaleTexte)
    } catch (e: any) {
      console.error("Erreur Jarvis Cloud:", e)
      let detail = e?.message || "raison inconnue"
      try {
        const parsed = JSON.parse(detail)
        detail = parsed?.error?.message || detail
      } catch {}
      setMessages(prev => {
        const copie = [...prev]
        copie[copie.length - 1] = { role: "assistant", texte: "Erreur Claude : " + detail, erreur: true }
        return copie
      })
    }
    setReflechit(false)
  }

  async function envoyer(texteDirect?: string) {
    const texte = (texteDirect ?? input).trim()
    if (!texte) return
    if (!texteDirect) setInput("")
    setReflechit(true)
    imageGenereeRef.current = null

    if (modeCloud) {
      if (!claudeKey) {
        setMessages(prev => [...prev, { role: "user", texte }, { role: "assistant", texte: "Ajoute d'abord ta clé API Claude (icône clé en haut à droite).", erreur: true }])
        setReflechit(false)
        return
      }
      await envoyerCloud(texte)
      return
    }

    const texteEnvoye = documentJoint
      ? `[Document joint : "${documentJoint.nom}"]\n\n${documentJoint.contenu}\n\n---\n\nQuestion de Pierre : ${texte}`
      : texte
    const nouvelHistorique: any[] = [...historique, { role: "user" as const, content: texteEnvoye }]
    setHistorique(nouvelHistorique)
    setMessages(prev => [...prev, { role: "user", texte }, { role: "assistant", texte: "Jarvis réfléchit..." }])

    try {
      let historiquePourFinal = nouvelHistorique

      const res1 = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages: nouvelHistorique, stream: false, tools: OUTILS })
      })
      if (!res1.ok) throw new Error("Pas de réponse d'Ollama")
      const data1 = await res1.json()

      if (data1.message?.tool_calls?.length) {
        setMessages(prev => {
          const copie = [...prev]
          copie[copie.length - 1] = { role: "assistant", texte: "Jarvis consulte tes données..." }
          return copie
        })
        historiquePourFinal = [...nouvelHistorique, data1.message]
        for (const appel of data1.message.tool_calls) {
          const nomOutil = appel.function?.name
          let args = appel.function?.arguments
          if (typeof args === "string") { try { args = JSON.parse(args) } catch { args = {} } }
          const resultat = await executerOutil(nomOutil, args || {})
          historiquePourFinal.push({ role: "tool", content: JSON.stringify(resultat) })
        }
      }

      const res2 = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages: historiquePourFinal, stream: true })
      })
      if (!res2.ok || !res2.body) throw new Error("Pas de réponse d'Ollama")

      const reader = res2.body.getReader()
      const decoder = new TextDecoder()
      let reponseComplete = ""
      let buffer = ""
      let premierMorceau = true

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
              if (premierMorceau) { reponseComplete = ""; premierMorceau = false }
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
      if (imageGenereeRef.current) {
        setMessages(prev => {
          const copie = [...prev]
          copie[copie.length - 1] = { role: "assistant", texte: reponseComplete, image: imageGenereeRef.current || undefined }
          return copie
        })
      }
      const nouveauxMessages = historiquePourFinal.slice(nouvelHistorique.length)
      setHistorique(prev => [...prev, ...nouveauxMessages, { role: "assistant", content: reponseComplete }])
      parler(reponseComplete)
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
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "radial-gradient(ellipse at top, #0A1628 0%, #050810 100%)", color: "#E8F1FF", position: "relative" }}>
      <canvas ref={fondCanvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, minHeight: "100vh" }}>
      <style>{`@keyframes pulseRing { 0% { opacity: 0.9; transform: scale(0.9); } 100% { opacity: 0; transform: scale(1.35); } }`}</style>
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px", borderBottom: "0.5px solid rgba(43,127,255,0.2)", background: "rgba(10,22,40,0.35)", backdropFilter: "blur(10px)" }}>
        <a href="/" style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", textDecoration: "none", marginRight: "4px" }}>←</a>
        <div style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff" }}>Jarvis</div>
        <div style={{ fontSize: "11px", color: modeCloud ? (claudeKey ? "#10B981" : "#F43F5E") : (statut.ok === true ? "#10B981" : statut.ok === false ? "#F43F5E" : "rgba(232,241,255,0.4)"), marginLeft: "auto" }}>
          {modeCloud ? (claudeKey ? "Cloud (Claude) actif" : "Ajoute ta clé API →") : statut.texte}
        </div>
        <button
          onClick={() => setModeCloud(v => !v)}
          style={{ fontSize: "11px", fontWeight: 500, background: modeCloud ? "#2B7FFF" : "rgba(255,255,255,0.08)", color: modeCloud ? "#fff" : "rgba(232,241,255,0.6)", border: "0.5px solid " + (modeCloud ? "#2B7FFF" : "rgba(43,127,255,0.3)"), borderRadius: "99px", padding: "4px 10px", cursor: "pointer" }}>
          {modeCloud ? "Cloud" : "Local"}
        </button>
        <button onClick={() => setMontrerConfigCloud(v => !v)} aria-label="Configurer la clé Claude" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(232,241,255,0.5)", display: "flex", alignItems: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
        </button>
        <button onClick={() => { setVoixActive(v => { if (v) window.speechSynthesis.cancel(); return !v }) }} aria-label={voixActive ? "Couper la voix" : "Activer la voix"} style={{ background: "none", border: "none", cursor: "pointer", color: voixActive ? "#FFB74D" : "rgba(232,241,255,0.3)", display: "flex", alignItems: "center" }}>
          {voixActive ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          )}
        </button>
        {voixDisponibles.length > 0 && (
          <select
            value={voixChoisie}
            onChange={e => { setVoixChoisie(e.target.value); localStorage.setItem("jarvis_voix", e.target.value) }}
            style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(43,127,255,0.3)", borderRadius: "8px", color: "#E8F1FF", fontSize: "11px", padding: "3px 6px", maxWidth: "110px" }}>
            {voixDisponibles.map(v => (
              <option key={v.voiceURI} value={v.voiceURI} style={{ color: "#000" }}>{v.name}</option>
            ))}
          </select>
        )}
      </div>

      {montrerConfigCloud && (
        <div style={{ padding: "12px 18px", borderBottom: "0.5px solid rgba(43,127,255,0.2)", background: "rgba(10,22,40,0.4)", display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="password"
            defaultValue={claudeKey}
            placeholder="sk-ant-... (ta clé API Claude)"
            onChange={e => setClaudeKey(e.target.value)}
            style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(43,127,255,0.3)", borderRadius: "8px", padding: "8px 10px", color: "#fff", fontSize: "12px", outline: "none" }}
          />
          <button
            onClick={() => { localStorage.setItem("jarvis_claude_key", claudeKey); setMontrerConfigCloud(false) }}
            style={{ background: "#2B7FFF", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
            Enregistrer
          </button>
        </div>
      )}

      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 12px" }}>
          <canvas ref={canvasRef} width={320} height={320} style={{ width: "200px", height: "200px" }} />
        </div>
        {messages.map((m, i) => (
          <div key={i} style={{
            maxWidth: "82%", padding: "12px 16px", borderRadius: "14px", fontSize: "14px", lineHeight: 1.5, whiteSpace: "pre-wrap",
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            background: m.role === "user" ? "rgba(43,127,255,0.16)" : "rgba(255,178,60,0.07)",
            backdropFilter: "blur(8px)",
            color: m.erreur ? "#F43F5E" : "#E8F1FF",
            border: "0.5px solid " + (m.role === "user" ? "rgba(90,160,255,0.45)" : "rgba(255,178,60,0.3)"),
            boxShadow: m.role === "user" ? "0 0 16px rgba(43,127,255,0.12)" : "0 0 16px rgba(255,178,60,0.08)",
            borderBottomRightRadius: m.role === "user" ? "3px" : "14px",
            borderBottomLeftRadius: m.role === "assistant" ? "3px" : "14px",
          }}>
            {m.texte}
            {m.image && (
              <img src={`data:image/png;base64,${m.image}`} alt="Image générée par Jarvis" style={{ width: "100%", maxWidth: "320px", borderRadius: "10px", marginTop: "10px", display: "block" }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: "14px 18px 20px", borderTop: "0.5px solid rgba(43,127,255,0.2)", background: "rgba(10,22,40,0.35)", backdropFilter: "blur(10px)" }}>
        {documentJoint && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,178,60,0.1)", border: "0.5px solid rgba(255,178,60,0.35)", borderRadius: "99px", padding: "5px 10px", marginBottom: "8px", width: "fit-content" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFB74D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span style={{ fontSize: "12px", color: "#FFB74D" }}>{documentJoint.nom}</span>
            <button onClick={() => setDocumentJoint(null)} aria-label="Retirer le document" style={{ background: "none", border: "none", color: "#FFB74D", cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: 0 }}>×</button>
          </div>
        )}
        <input ref={fichierInputRef} type="file" accept=".txt,.md" onChange={fichierSelectionne} style={{ display: "none" }} />
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <button
            onClick={() => fichierInputRef.current?.click()}
            aria-label="Joindre un document"
            style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(43,127,255,0.3)", borderRadius: "12px", width: "44px", height: "44px", flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer() } }}
            rows={1}
            placeholder="Écris à Jarvis..."
            style={{ flex: 1, resize: "none", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(43,127,255,0.3)", borderRadius: "12px", padding: "12px 14px", color: "#fff", fontSize: "14px", fontFamily: "inherit", outline: "none", maxHeight: "140px" }}
          />
          <button
            onClick={() => setModeVocal(v => !v)}
            aria-label={modeVocal ? "Désactiver le mode vocal" : "Activer le mode vocal"}
            style={{
              background: modeVocal ? (ecoute ? "#F43F5E" : transcription ? "#8B5CF6" : "#2B7FFF") : "rgba(255,255,255,0.08)",
              border: "0.5px solid " + (modeVocal ? "transparent" : "rgba(43,127,255,0.3)"),
              borderRadius: "12px", width: "44px", height: "44px", flexShrink: 0,
              cursor: "pointer", position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
            {modeVocal && (ecoute || transcription) && (
              <span style={{ position: "absolute", inset: -3, borderRadius: "14px", border: "1.5px solid " + (ecoute ? "#F43F5E" : "#8B5CF6"), animation: "pulseRing 1.1s ease-out infinite" }} />
            )}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
          </button>
          <button onClick={() => envoyer()} disabled={reflechit} style={{ background: "#2B7FFF", border: "none", borderRadius: "12px", width: "44px", height: "44px", flexShrink: 0, cursor: reflechit ? "default" : "pointer", opacity: reflechit ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
        <div style={{ fontSize: "11px", color: "rgba(232,241,255,0.3)", marginTop: "8px", textAlign: "center" }}>100% local · tes messages ne quittent jamais ton Mac</div>
      </div>
      </div>
    </main>
  )
}
