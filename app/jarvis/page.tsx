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
- Toutes tes réponses restent strictement locales sur la machine de Pierre, rien ne sort jamais de son Mac.`

const OUTILS = [
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
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; texte: string; erreur?: boolean }[]>([
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
  const [modeCloud, setModeCloud] = useState(false)
  const [claudeKey, setClaudeKey] = useState("")
  const [montrerConfigCloud, setMontrerConfigCloud] = useState(false)
  const [historiqueCloud, setHistoriqueCloud] = useState<any[]>([])
  const [statut, setStatut] = useState<{ texte: string; ok: boolean | null }>({ texte: "Connexion à Ollama...", ok: null })
  const chatRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const angleRef = useRef({ a: 0, a2: 0 })
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const etincellesRef = useRef<{ theta: number; phi: number; vitesse: number; vie: number }[]>([])
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
    let messagesActuels: any[] = [...historiqueCloud, { role: "user", content: texte }]
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
        copie[copie.length - 1] = { role: "assistant", texte: reponseFinaleTexte }
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

    if (modeCloud) {
      if (!claudeKey) {
        setMessages(prev => [...prev, { role: "user", texte }, { role: "assistant", texte: "Ajoute d'abord ta clé API Claude (icône clé en haut à droite).", erreur: true }])
        setReflechit(false)
        return
      }
      await envoyerCloud(texte)
      return
    }

    const nouvelHistorique: any[] = [...historique, { role: "user" as const, content: texte }]
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
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "radial-gradient(ellipse at top, #0A1628 0%, #050810 100%)", color: "#E8F1FF" }}>
      <style>{`@keyframes pulseRing { 0% { opacity: 0.9; transform: scale(0.9); } 100% { opacity: 0; transform: scale(1.35); } }`}</style>
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px", borderBottom: "0.5px solid rgba(43,127,255,0.2)", background: "rgba(10,22,40,0.6)" }}>
        <a href="/" style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", textDecoration: "none", marginRight: "4px" }}>←</a>
        <canvas ref={canvasRef} width={112} height={112} style={{ width: "50px", height: "50px", flexShrink: 0 }} />
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
    </main>
  )
}
