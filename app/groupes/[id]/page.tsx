"use client"
import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { authHeaders } from "@/lib/authFetch"
import Card from "@/app/components/ui/Card"
import Button from "@/app/components/ui/Button"
import { colors } from "@/app/components/ui/tokens"

function hexVersRgb(hex: string) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r},${g},${b}`
}

function GlisserConfirmer({ label, couleur, onConfirm }: { label: string; couleur: string; onConfirm: () => void }) {
  const [pos, setPos] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [fait, setFait] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const rgb = hexVersRgb(couleur)

  useEffect(() => {
    if (!dragging) return
    function calc(clientX: number) {
      const track = trackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      const utile = rect.width - 56
      let pct = ((clientX - rect.left - 28) / utile) * 100
      pct = Math.max(0, Math.min(100, pct))
      posRef.current = pct
      setPos(pct)
    }
    function onMove(e: any) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      calc(clientX)
    }
    function onUp() {
      setDragging(false)
      if (posRef.current > 78) {
        setPos(100)
        setFait(true)
        onConfirm()
      } else {
        setPos(0)
        posRef.current = 0
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [dragging])

  return (
    <div ref={trackRef} style={{
      position:'relative', height:'58px', borderRadius:'29px', overflow:'hidden', userSelect:'none', touchAction:'none',
      background: fait ? couleur : 'rgba(255,255,255,0.4)',
      backdropFilter: fait ? 'none' : 'blur(14px) saturate(180%)',
      WebkitBackdropFilter: fait ? 'none' : 'blur(14px) saturate(180%)',
      border: fait ? 'none' : '1px solid rgba(255,255,255,0.7)',
      boxShadow: fait ? `0 4px 14px rgba(${rgb},0.35)` : `inset 0 1px 1px rgba(255,255,255,0.8), 0 4px 16px rgba(${rgb},0.15)`,
      transition:'background 0.3s'
    }}>
      {!fait && (
        <div style={{position:'absolute', top:0, left:0, right:0, height:'50%', background:'linear-gradient(rgba(255,255,255,0.35),transparent)', pointerEvents:'none'}}/>
      )}
      {!fait && (
        <div style={{position:'absolute', inset:0, width:`${Math.min(pos + 15, 100)}%`, background:`linear-gradient(135deg, rgba(${rgb},0.4), rgba(${rgb},0.28))`, transition: dragging ? 'none' : 'width 0.25s ease'}}/>
      )}
      <div style={{position:'relative', inset:0, height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:600, color: fait ? '#fff' : '#1a3a6e', opacity: fait ? 1 : Math.max(0, 1 - pos/45), pointerEvents:'none', textShadow: fait ? 'none' : '0 1px 2px rgba(255,255,255,0.5)'}}>
        {fait ? '✓ Confirmé' : label}
      </div>
      <div
        onMouseDown={() => !fait && setDragging(true)}
        onTouchStart={() => !fait && setDragging(true)}
        style={{
          position:'absolute', top:'3px', left: `calc(3px + (100% - 56px) * ${(pos/100).toFixed(4)})`,
          width:'52px', height:'52px', borderRadius:'50%',
          background: fait ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.55)',
          backdropFilter:'blur(10px) saturate(180%)', WebkitBackdropFilter:'blur(10px) saturate(180%)',
          border: fait ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.85)',
          display:'flex', alignItems:'center', justifyContent:'center', cursor: fait ? 'default' : 'grab',
          boxShadow: `0 4px 12px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.9)`,
          transition: dragging ? 'none' : 'left 0.25s ease'
        }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={fait ? '#fff' : couleur} strokeWidth="2.6"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>
  )
}

export default function GroupePage() {
  const { id } = useParams()
  const [groupe, setGroupe] = useState<any>(null)
  const [autreProfilDM, setAutreProfilDM] = useState<any>(null)
  const [annonceLiee, setAnnonceLiee] = useState<any>(null)
  const [montrerAvis, setMontrerAvis] = useState(false)
  const [noteAvis, setNoteAvis] = useState(0)
  const [commentaireAvis, setCommentaireAvis] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [projets, setProjets] = useState<any[]>([])
  const [membres, setMembres] = useState<any[]>([])
  const [profils, setProfils] = useState<any>({})
  const [user, setUser] = useState<any>(null)
  const [contenu, setContenu] = useState("")
  const [onglet, setOnglet] = useState("discussion")
  const [listes, setListes] = useState<any[]>([])
  const [estMembre, setEstMembre] = useState(false)
  const [paiementEnCours, setPaiementEnCours] = useState(false)
  const [lienInvitation, setLienInvitation] = useState("")
  const [copie, setCopie] = useState(false)
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [messageActif, setMessageActif] = useState<any>(null)
  const [editionId, setEditionId] = useState<string|null>(null)
  const [editionTexte, setEditionTexte] = useState("")
  const [reactions, setReactions] = useState<any[]>([])
  const [pickerMsg, setPickerMsg] = useState<string|null>(null)
  const messagesEndRef = useRef<any>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: g } = await supabase.from("groupes").select("*").eq("id", id).single()
      setGroupe(g)
      if (g?.annonce_id) {
        const { data: ann } = await supabase.from("marketplace_annonces").select("*").eq("id", g.annonce_id).single()
        setAnnonceLiee(ann)
      }
      if (g?.est_dm && user) {
        const { data: mbDm } = await supabase.from("membres_groupe").select("user_id").eq("groupe_id", id)
        const autre = (mbDm || []).find((m: any) => m.user_id !== user.id)
        if (autre) {
          const { data: prof } = await supabase.from("profiles").select("id,nom,avatar_url").eq("id", autre.user_id).single()
          setAutreProfilDM(prof)
        }
      }
      const { data: m } = await supabase.from("messages_groupe").select("*").eq("groupe_id", id).order("created_at", { ascending: true })
      setMessages(m || [])
      if (m && m.length > 0) {
        const { data: r } = await supabase.from("messages_groupe_reactions").select("*").in("message_id", m.map((x: any) => x.id))
        setReactions(r || [])
      }
      const { data: mb } = await supabase.from("membres_groupe").select("*").eq("groupe_id", id)
      setMembres(mb || [])
      if (mb && mb.length > 0) {
        const ids = mb.map((m: any) => m.user_id)
        const { data: profs } = await supabase.from("profiles").select("id,nom,avatar_url").in("id", ids)
        const profilsMap: any = {}
        profs?.forEach((p: any) => { profilsMap[p.id] = p })
        setProfils(profilsMap)
      }
      if (user) {
        const membre = mb?.find((m: any) => m.user_id === user.id)
        setEstMembre(!!membre)
      }
      const { data: p } = await supabase.from("projets").select("*").eq("groupe_id", id).order("created_at", { ascending: false })
      setProjets(p || [])
      const { data: lst } = await supabase.from('listes').select('*').eq('groupe_id', id).order('created_at', { ascending: false })
      setListes(lst || [])
    }
    charger()

    const nomCanal = 'messages-' + id
    supabase.getChannels().filter((ch: any) => ch.topic?.includes(nomCanal)).forEach((ch: any) => supabase.removeChannel(ch))

    channelRef.current = supabase
      .channel(nomCanal)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_groupe', filter: 'groupe_id=eq.' + id },
        (payload) => setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages_groupe', filter: 'groupe_id=eq.' + id },
        (payload) => setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages_groupe', filter: 'groupe_id=eq.' + id },
        (payload) => setMessages(prev => prev.filter(m => m.id !== payload.old.id)))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_groupe_reactions' },
        (payload) => setReactions(prev => prev.some((r: any) => r.id === payload.new.id) ? prev : [...prev, payload.new]))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages_groupe_reactions' },
        (payload) => setReactions(prev => prev.filter((r: any) => r.id !== payload.old.id)))
      .subscribe()

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!groupe?.annonce_id) return
    const nomCanalAnnonce = 'annonce-liee-' + groupe.annonce_id
    supabase.getChannels().filter((ch: any) => ch.topic?.includes(nomCanalAnnonce)).forEach((ch: any) => supabase.removeChannel(ch))
    const canalAnnonce = supabase
      .channel(nomCanalAnnonce)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'marketplace_annonces', filter: 'id=eq.' + groupe.annonce_id },
        (payload: any) => setAnnonceLiee(payload.new))
      .subscribe()
    return () => { supabase.removeChannel(canalAnnonce) }
  }, [groupe?.annonce_id])

  async function payerAnnonce() {
    if (!annonceLiee || !user) return
    setPaiementEnCours(true)
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ annonceId: annonceLiee.id, groupeId: id, retourUrl: window.location.href }),
    })
    const data = await res.json()
    setPaiementEnCours(false)
    if (data.url) window.location.href = data.url
    else alert(data.error || "Erreur lors du paiement")
  }

  async function libererPaiement() {
    if (!annonceLiee || !user) return
    const res = await fetch("/api/stripe/liberer", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ annonceId: annonceLiee.id }),
    })
    const data = await res.json()
    if (!data.success) { alert(data.error || "Erreur lors de la libération du paiement"); return }
    setAnnonceLiee((prev: any) => ({ ...prev, statut: "vendu" }))
    await supabase.from("messages_groupe").insert({ groupe_id: id, user_id: user.id, contenu: `✅ Réception confirmée pour "${annonceLiee.titre}" — paiement transféré au vendeur, reçus ajoutés dans les Finances de chacun.` })
    setMontrerAvis(true)
  }

  async function envoyerAvis() {
    if (!annonceLiee || !user || noteAvis === 0) return
    await supabase.from("marketplace_avis").insert({
      annonce_id: annonceLiee.id, auteur_id: user.id, cible_id: annonceLiee.user_id,
      note: noteAvis, commentaire: commentaireAvis.trim() || null,
    })
    setMontrerAvis(false); setNoteAvis(0); setCommentaireAvis("")
  }

  async function genererInvitation() {
    const { data, error } = await supabase.from("invitations").insert({ groupe_id: id, created_by: user.id }).select().single()
    if (!error) {
      const lien = `${window.location.origin}/rejoindre/${data.code}`
      setLienInvitation(lien)
    }
    setMenuOuvert(false)
  }

  async function copierLien() {
    await navigator.clipboard.writeText(lienInvitation)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  async function envoyer() {
    if (!contenu || !user) return
    const texteEnvoye = contenu
    setContenu("")
    const { data, error } = await supabase.from("messages_groupe").insert({ groupe_id: id, user_id: user.id, contenu: texteEnvoye }).select().single()
    if (!error && data) {
      setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data])
      // Notifier les autres membres
      const autresMembers = membres.filter((m: any) => m.user_id !== user.id)
      const nomExp = profils[user.id]?.nom || user.email?.split('@')[0] || 'Quelquun'
      for (const membre of autresMembers) {
        await supabase.from("notifications").insert({
          user_id: membre.user_id,
          type: 'message',
          titre: groupe?.nom || 'Groupe',
          contenu: nomExp + ' : ' + texteEnvoye.substring(0, 60),
          lien: '/groupes/' + id
        })
      }
    }
  }

  async function supprimerMessage(messageId: string) {
    await supabase.from("messages_groupe").delete().eq("id", messageId)
    setMessageActif(null)
  }

  const EMOJIS_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

  function reactionsDuMessage(messageId: string) {
    const counts: Record<string, number> = {}
    reactions.filter((r: any) => r.message_id === messageId).forEach((r: any) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1 })
    return counts
  }

  function maReaction(messageId: string) {
    return reactions.find((r: any) => r.message_id === messageId && r.user_id === user?.id)
  }

  async function toggleReaction(messageId: string, emoji: string) {
    if (!user) return
    const existante = reactions.find((r: any) => r.message_id === messageId && r.user_id === user.id)
    setPickerMsg(null)
    if (existante && existante.emoji === emoji) {
      await supabase.from("messages_groupe_reactions").delete().eq("id", existante.id)
      setReactions(prev => prev.filter((r: any) => r.id !== existante.id))
      return
    }
    if (existante) {
      await supabase.from("messages_groupe_reactions").delete().eq("id", existante.id)
      setReactions(prev => prev.filter((r: any) => r.id !== existante.id))
    }
    const { data } = await supabase.from("messages_groupe_reactions").insert({ message_id: messageId, user_id: user.id, emoji }).select().single()
    if (data) setReactions(prev => [...prev, data])
  }

  async function sauverEdition() {
    if (!editionTexte.trim() || !editionId) return
    await supabase.from("messages_groupe").update({ contenu: editionTexte }).eq("id", editionId)
    setEditionId(null)
    setEditionTexte("")
    setMessageActif(null)
  }

  function estMessageAppel(contenu: string, createdAt: string) {
    if (!contenu.includes('a lance un appel')) return false
    const minutes = (Date.now() - new Date(createdAt).getTime()) / 60000
    return minutes < 30
  }

  const messagesAffiches = messages.filter(m => {
    if (m.contenu.includes('a lance un appel')) return estMessageAppel(m.contenu, m.created_at)
    return true
  })

  if (!groupe) return <div className="p-8 text-center text-gray-400">Chargement...</div>

  if (!estMembre) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center px-5">
        <div className="text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" style={{marginBottom:"16px"}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <h1 className="text-lg font-medium text-gray-900 mb-2">{groupe.nom}</h1>
          <p className="text-sm text-gray-400 mb-6">Ce groupe est privé. Tu as besoin d'une invitation pour y accéder.</p>
          <a href="/groupes" className="text-blue-500 text-sm font-medium">← Retour aux groupes</a>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen bg-white flex flex-col overflow-hidden">
      <div className="bg-white border-b border-blue-50 px-5 py-4 flex items-center justify-between">
        <a href="/groupes" className="text-gray-400 text-sm">← Retour</a>
        <div className="text-center">
          <p className="text-base font-medium text-gray-900">{groupe.est_dm ? (autreProfilDM?.nom || "Conversation") : groupe.nom}</p>
          <p className="text-xs text-gray-400">{groupe.est_dm ? "Message privé" : `${membres.length} membres`}</p>
        </div>
        {!groupe.est_dm && (
        <div style={{position:'relative'}}>
          <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
            <a href={'/groupes/' + id + '/appel'}>
              <button style={{width:'42px',height:'42px',borderRadius:'50%',background:'#E8F5E9',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.47 2 2 0 0 1 3.54 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </button>
            </a>
            <button onClick={() => setMenuOuvert(!menuOuvert)}
              style={{height:'42px',padding:'0 14px',borderRadius:'12px',background:'#EEF5FF',border:'1.5px solid #2B7FFF',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              <span style={{fontSize:'13px',fontWeight:'500',color:'#2B7FFF'}}>Menu</span>
            </button>
          </div>
          {menuOuvert && (
            <>
              <div onClick={() => setMenuOuvert(false)} style={{position:'fixed',inset:0,zIndex:10}}></div>
              <div style={{position:'absolute',top:'44px',right:0,background:'#fff',borderRadius:'16px',boxShadow:'0 8px 30px rgba(0,0,0,0.12)',border:'0.5px solid #E8F1FF',overflow:'hidden',zIndex:20,minWidth:'200px'}}>

                <a href={'/groupes/' + id + '/listes'} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'0.5px solid #F0F4FA'}}><div style={{display:'flex',alignItems:'center',gap:'12px'}}><svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#10B981' strokeWidth='2'><line x1='8' y1='6' x2='21' y2='6'/><line x1='8' y1='12' x2='21' y2='12'/><line x1='8' y1='18' x2='21' y2='18'/><line x1='3' y1='6' x2='3.01' y2='6'/><line x1='3' y1='12' x2='3.01' y2='12'/><line x1='3' y1='18' x2='3.01' y2='18'/></svg><span style={{fontSize:'14px',color:'#1a1a2e'}}>Listes partagees</span></div><svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='2'><polyline points='9 18 15 12 9 6'/></svg></div></a><a href={'/groupes/' + id + '/depenses'} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'0.5px solid #F0F4FA'}}><div style={{display:'flex',alignItems:'center',gap:'12px'}}><svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#2B7FFF' strokeWidth='2'><line x1='12' y1='1' x2='12' y2='23'/><path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'/></svg><span style={{fontSize:'14px',color:'#1a1a2e'}}>Dépenses partagées</span></div><svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='2'><polyline points='9 18 15 12 9 6'/></svg></div></a><a href={'/groupes/' + id + '/objectifs'} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'0.5px solid #F0F4FA'}}><div style={{display:'flex',alignItems:'center',gap:'12px'}}><svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#D4A843' strokeWidth='2'><circle cx='12' cy='12' r='10'/><circle cx='12' cy='12' r='6'/><circle cx='12' cy='12' r='2'/></svg><span style={{fontSize:'14px',color:'#1a1a2e'}}>Objectifs de groupe</span></div><svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='2'><polyline points='9 18 15 12 9 6'/></svg></div></a><a href={'/groupes/' + id + '/sondages'} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'0.5px solid #F0F4FA'}}><div style={{display:'flex',alignItems:'center',gap:'12px'}}><svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#F97316' strokeWidth='2'><path d='M18 20V10'/><path d='M12 20V4'/><path d='M6 20v-6'/></svg><span style={{fontSize:'14px',color:'#1a1a2e'}}>Sondages</span></div><svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='2'><polyline points='9 18 15 12 9 6'/></svg></div></a><a href={'/groupes/' + id + '/activites'} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'0.5px solid #F0F4FA'}}><div style={{display:'flex',alignItems:'center',gap:'12px'}}><svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#8B5CF6' strokeWidth='2'><rect x='3' y='4' width='18' height='18' rx='2' ry='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/></svg><span style={{fontSize:'14px',color:'#1a1a2e'}}>Activites</span></div><svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='2'><polyline points='9 18 15 12 9 6'/></svg></div></a><a href={'/groupes/' + id + '/journal'} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'0.5px solid #F0F4FA'}}><div style={{display:'flex',alignItems:'center',gap:'12px'}}><svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#0A1628' strokeWidth='2'><path d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20'/><path d='M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'/></svg><span style={{fontSize:'14px',color:'#1a1a2e'}}>Journal du groupe</span></div><svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='2'><polyline points='9 18 15 12 9 6'/></svg></div></a><a href={'/groupes/' + id + '/colocation'} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'0.5px solid #F0F4FA'}}><div style={{display:'flex',alignItems:'center',gap:'12px'}}><svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#2B7FFF' strokeWidth='2'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/></svg><span style={{fontSize:'14px',color:'#1a1a2e'}}>Mode colocation</span></div><svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='2'><polyline points='9 18 15 12 9 6'/></svg></div></a><a href={'/groupes/' + id + '/taches'} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'0.5px solid #F0F4FA'}}><div style={{display:'flex',alignItems:'center',gap:'12px'}}><svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#8B5CF6' strokeWidth='2'><line x1='3' y1='6' x2='21' y2='6'/><line x1='3' y1='12' x2='21' y2='12'/><line x1='3' y1='18' x2='21' y2='18'/></svg><span style={{fontSize:'14px',color:'#1a1a2e'}}>Tâches ménagères</span></div><svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='2'><polyline points='9 18 15 12 9 6'/></svg></div></a><a href={'/groupes/' + id + '/disponibilites'} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'0.5px solid #F0F4FA'}}><div style={{display:'flex',alignItems:'center',gap:'12px'}}><svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#10B981' strokeWidth='2'><rect x='3' y='4' width='18' height='18' rx='2' ry='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/><path d='M9 16l2 2 4-4'/></svg><span style={{fontSize:'14px',color:'#1a1a2e'}}>Disponibilités</span></div><svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='2'><polyline points='9 18 15 12 9 6'/></svg></div></a><div onClick={genererInvitation} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',cursor:'pointer'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    <span style={{fontSize:'14px',color:'#1a1a2e'}}>Inviter un membre</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            </>
          )}
        </div>
        )}
      </div>

      {annonceLiee && annonceLiee.statut !== "vendu" && (
        <div style={{padding:'14px 18px', borderBottom:'0.5px solid #F0F4FA', background:'#FAFCFF'}}>
          <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px'}}>
            <div style={{width:'46px', height:'46px', borderRadius:'12px', background:'linear-gradient(135deg,#EEF5FF,#DCE9FF)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden'}}>
              {annonceLiee.image_url ? (
                <img src={annonceLiee.image_url} alt={annonceLiee.titre} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              )}
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:'13px', fontWeight:'600', color:'#1a1a2e', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{annonceLiee.titre}</div>
              <div style={{fontSize:'13px', fontWeight:'700', color:'#2B7FFF'}}>{parseFloat(annonceLiee.prix).toFixed(0)} CHF</div>
            </div>
            <span style={{fontSize:'10px', fontWeight:'600', padding:'4px 10px', borderRadius:'99px', flexShrink:0,
              background: annonceLiee.statut === 'vendu' ? '#E1F5EE' : annonceLiee.statut === 'réservé' ? '#FDF8EC' : '#EEF5FF',
              color: annonceLiee.statut === 'vendu' ? '#10B981' : annonceLiee.statut === 'réservé' ? '#D4A843' : '#2B7FFF'}}>
              {annonceLiee.statut === 'vendu' ? 'Vendu' : annonceLiee.statut === 'réservé' ? 'Réservé' : 'Disponible'}
            </span>
          </div>

          {user && annonceLiee.user_id !== user.id && annonceLiee.statut === 'disponible' && (
            <button onClick={payerAnnonce} disabled={paiementEnCours}
              style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'#1a1a2e',color:'#fff',border:'none',borderRadius:'14px',padding:'14px',fontSize:'14px',fontWeight:'700',cursor: paiementEnCours ? 'default' : 'pointer',opacity: paiementEnCours ? 0.6 : 1}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              {paiementEnCours ? 'Redirection...' : `Payer ${parseFloat(annonceLiee.prix).toFixed(0)} CHF en sécurité`}
            </button>
          )}
          {user && annonceLiee.user_id === user.id && annonceLiee.statut === 'disponible' && (
            <div style={{fontSize:'12px', color:'#aaa', textAlign:'center'}}>En attente que l'acheteur paie</div>
          )}
          {user && annonceLiee.statut === 'réservé' && annonceLiee.acheteur_id === user.id && (
            <GlisserConfirmer label="Glisser une fois l'objet bien reçu" couleur="#10B981" onConfirm={libererPaiement} />
          )}
          {user && annonceLiee.statut === 'réservé' && annonceLiee.user_id === user.id && (
            <div style={{fontSize:'12px', color:'#D4A843', textAlign:'center'}}>💳 Paiement reçu et retenu en sécurité — en attente que l'acheteur confirme la réception</div>
          )}
        </div>
      )}

      {montrerAvis && annonceLiee && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <Card style={{maxWidth:'340px',width:'100%'}}>
            <div style={{fontSize:'15px',fontWeight:600,color:colors.text,marginBottom:'4px',textAlign:'center'}}>Comment s'est passé l'achat ?</div>
            <div style={{fontSize:'12px',color:colors.textFaint,marginBottom:'14px',textAlign:'center'}}>Note ton expérience avec le vendeur</div>
            <div style={{display:'flex',justifyContent:'center',gap:'6px',marginBottom:'14px'}}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setNoteAvis(n)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'28px',padding:0,color: n <= noteAvis ? colors.gold : '#E8F1FF'}}>★</button>
              ))}
            </div>
            <textarea value={commentaireAvis} onChange={e => setCommentaireAvis(e.target.value)} placeholder="Un commentaire (optionnel)"
              style={{width:'100%',border:`1px solid ${colors.border}`,borderRadius:'10px',padding:'10px 12px',fontSize:'14px',color:colors.text,marginBottom:'12px',boxSizing:'border-box',resize:'none',height:'60px'}}/>
            <div style={{display:'flex',gap:'8px'}}>
              <Button full disabled={noteAvis === 0} onClick={envoyerAvis}>Envoyer</Button>
              <Button variant="ghost" full onClick={() => setMontrerAvis(false)}>Plus tard</Button>
            </div>
          </Card>
        </div>
      )}

      {lienInvitation && (
        <div className="mx-5 mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-700 mb-2">Lien d'invitation :</p>
          <div className="flex gap-2 items-center">
            <p className="text-xs text-blue-500 flex-1 truncate">{lienInvitation}</p>
            <button onClick={copierLien} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full flex-shrink-0">
              {copie ? "Copié !" : "Copier"}
            </button>
          </div>
        </div>
      )}

      {!groupe.est_dm && (
      <div className="flex border-b border-blue-50" style={{overflowX:"auto",whiteSpace:"nowrap"}}>
        <button onClick={() => setOnglet("discussion")}
          className={`flex-1 py-3 text-sm font-medium ${onglet === "discussion" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400"}`}>
          Discussion
        </button>
        <button onClick={() => setOnglet("projets")}
          className={`flex-1 py-3 text-sm font-medium ${onglet === "projets" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400"}`}>
          Projets ({projets.length})
        </button>
        <button onClick={() => setOnglet("membres")}
          className={`flex-1 py-3 text-sm font-medium ${onglet === "membres" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400"}`}>
          Membres</button>
          <button onClick={() => setOnglet('listes')}
          className={`flex-1 py-3 text-sm font-medium ${onglet === 'listes' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}>
          Listes
        </button>
      </div>
      )}

      {onglet === 'listes' && (
        <div style={{padding:'14px'}}>
          <a href={'/groupes/'+id+'/listes'} style={{textDecoration:'none',display:'block',marginBottom:'14px'}}>
            <button style={{width:'100%',background:'#EEF5FF',color:'#2B7FFF',border:'0.5px solid #DCE9FF',borderRadius:'12px',padding:'12px',fontSize:'13px',fontWeight:'500',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nouvelle liste
            </button>
          </a>
          {listes.length === 0 && (
            <div style={{textAlign:'center',padding:'32px 0',color:'#aaa',fontSize:'13px'}}>Aucune liste pour l instant</div>
          )}
          {listes.map((l: any, i: number) => {
            const couleurs = [{bg:'#EEF5FF',stroke:'#2B7FFF'},{bg:'#FDF8EC',stroke:'#D4A843'},{bg:'#E1F5EE',stroke:'#10B981'}]
            const col = couleurs[i % 3]
            return (
              <a key={l.id} href={'/groupes/'+id+'/listes/'+l.id} style={{textDecoration:'none',display:'block',marginBottom:'10px'}}>
                <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'14px',padding:'14px',display:'flex',alignItems:'center',gap:'12px'}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'12px',background:col.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={col.stroke} strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e',marginBottom:'2px'}}>{l.titre}</div>
                    <div style={{fontSize:'11px',color:'#aaa'}}>{l.budget > 0 ? 'Budget: '+parseFloat(l.budget).toFixed(0)+' CHF' : 'Pas de budget'}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </a>
            )
          })}
        </div>
      )}

      {onglet === "discussion" && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 px-5 py-4 overflow-y-auto min-h-0">
            {messagesAffiches.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" style={{marginBottom:"8px"}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <p className="text-sm">Sois le premier à écrire dans ce groupe !</p>
              </div>
            )}
            {messagesAffiches.map((m: any, i: number) => {
              const estMoi = m.user_id === user?.id
              const enEdition = editionId === m.id
              const suivant = messagesAffiches[i + 1]
              const memeGroupeApres = suivant && suivant.user_id === m.user_id
              return (
                <div key={m.id} className={`flex gap-2 ${estMoi ? "flex-row-reverse" : ""}`} style={{position:'relative', marginBottom: memeGroupeApres ? '2px' : '12px'}}>
                  <div style={{width:'28px', flexShrink:0}}>
                    {!estMoi && !memeGroupeApres && (
                      <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                        {(profils[m.user_id]?.nom || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{maxWidth:'75%'}}>
                    {enEdition ? (
                      <div style={{background:'#fff',border:'1px solid #2B7FFF',borderRadius:'18px',padding:'8px 12px'}}>
                        <input value={editionTexte} onChange={e => setEditionTexte(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && sauverEdition()}
                          style={{width:'100%',border:'none',outline:'none',fontSize:'14px',color:'#1a1a2e'}} autoFocus/>
                        <div style={{display:'flex',gap:'8px',marginTop:'6px'}}>
                          <button onClick={sauverEdition} style={{fontSize:'11px',color:'#2B7FFF',background:'none',border:'none',cursor:'pointer',fontWeight:'500'}}>Enregistrer</button>
                          <button onClick={() => setEditionId(null)} style={{fontSize:'11px',color:'#aaa',background:'none',border:'none',cursor:'pointer'}}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <div onTouchStart={() => setMessageActif(messageActif === m.id ? null : m.id)}
                        onClick={() => setMessageActif(messageActif === m.id ? null : m.id)}
                        className={`px-4 py-2 text-sm ${estMoi ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"}`}
                        style={{cursor: 'pointer', borderRadius:'18px'}}>
                        {m.contenu} {m.modifie && <span style={{fontSize:'10px',opacity:0.6}}>(modifié)</span>}
                      </div>
                    )}
                    {Object.keys(reactionsDuMessage(m.id)).length > 0 && (
                      <div style={{display:'flex',gap:'4px',marginTop:'4px',flexWrap:'wrap',justifyContent: estMoi ? 'flex-end' : 'flex-start'}}>
                        {Object.entries(reactionsDuMessage(m.id)).map(([emoji, count]) => (
                          <button key={emoji} onClick={() => toggleReaction(m.id, emoji)}
                            style={{display:'flex',alignItems:'center',gap:'3px',fontSize:'11px',background: maReaction(m.id)?.emoji === emoji ? '#EEF5FF' : '#F5F7FA',border: maReaction(m.id)?.emoji === emoji ? '1px solid #2B7FFF' : '1px solid transparent',borderRadius:'99px',padding:'2px 7px',cursor:'pointer'}}>
                            {emoji} {count}
                          </button>
                        ))}
                      </div>
                    )}
                    {!enEdition && !memeGroupeApres && (
                      <div className={`text-xs mt-1 ${estMoi ? "text-right text-gray-400" : "text-gray-400"}`} style={{padding:'0 4px'}}>
                        {(() => { const d = new Date(m.created_at); d.setHours(d.getHours() + 2); return d.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) })()}
                      </div>
                    )}
                    {pickerMsg === m.id && (
                      <div style={{display:'flex',gap:'6px',marginTop:'6px',background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'99px',padding:'6px 10px',boxShadow:'0 4px 16px rgba(0,0,0,0.1)',justifyContent: estMoi ? 'flex-end' : 'flex-start'}}>
                        {EMOJIS_REACTIONS.map(e => (
                          <button key={e} onClick={() => toggleReaction(m.id, e)} style={{background:'none',border:'none',fontSize:'18px',cursor:'pointer',lineHeight:1}}>{e}</button>
                        ))}
                      </div>
                    )}
                    {messageActif === m.id && !enEdition && (
                      <div style={{display:'flex',gap:'8px',marginTop:'6px',justifyContent: estMoi ? 'flex-end' : 'flex-start'}}>
                        <button onClick={() => setPickerMsg(pickerMsg === m.id ? null : m.id)}
                          style={{fontSize:'11px',background:'#F8FBFF',color:'#2B7FFF',border:'1px solid #E8F1FF',borderRadius:'99px',padding:'4px 10px',cursor:'pointer'}}>
                          😀 Réagir
                        </button>
                        {estMoi && (
                        <button onClick={() => { setEditionId(m.id); setEditionTexte(m.contenu); setMessageActif(null) }}
                          style={{fontSize:'11px',background:'#F8FBFF',color:'#2B7FFF',border:'1px solid #E8F1FF',borderRadius:'99px',padding:'4px 10px',cursor:'pointer'}}>
                          <span style={{display:"flex",alignItems:"center",gap:"4px"}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Modifier</span>
                        </button>
                        )}
                        {estMoi && (
                        <button onClick={() => supprimerMessage(m.id)}
                          style={{fontSize:'11px',background:'#FFF5F5',color:'#F43F5E',border:'1px solid #FECDD3',borderRadius:'99px',padding:'4px 10px',cursor:'pointer'}}>
                          <span style={{display:"flex",alignItems:"center",gap:"4px"}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>Supprimer</span>
                        </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef}></div>
          </div>
          <div className="px-5 py-3 border-t border-blue-50 flex gap-3 items-center">
            <input type="text" placeholder="Écrire un message..." value={contenu}
              onChange={e => setContenu(e.target.value)}
              onKeyDown={e => e.key === "Enter" && envoyer()}
              className="flex-1 border border-blue-100 rounded-full px-4 py-2 text-sm text-gray-900 bg-blue-50 focus:outline-none focus:border-blue-400"/>
            <button onClick={envoyer} className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg">↑</button>
          </div>
        </div>
      )}

      {onglet === "projets" && (
        <div className="px-5 py-4">
          <a href="/nouveau-projet">
            <button className="w-full bg-blue-50 border border-blue-100 text-blue-500 text-sm font-medium py-3 rounded-xl mb-4">
              + Partager un projet dans ce groupe
            </button>
          </a>
          {projets.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
              <p className="text-sm">Aucun projet partagé dans ce groupe</p>
            </div>
          )}
          {projets.map((p: any) => (
            <a key={p.id} href={`/projet/${p.id}`}>
              <div className="bg-white border border-blue-100 rounded-2xl p-4 mb-3 cursor-pointer hover:border-blue-300">
                <span className="text-xs bg-blue-50 text-blue-500 px-2 py-1 rounded-full font-medium">{p.categorie}</span>
                <p className="font-medium text-gray-900 mt-2 mb-1">{p.titre}</p>
                <p className="text-xs text-gray-400">{p.description}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      {onglet === "membres" && (
        <div className="px-5 py-4">
          {membres.map((m: any) => (
            <div key={m.id} className="flex items-center gap-3 bg-white border border-blue-100 rounded-xl p-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {(profils[m.user_id]?.nom || "?")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{profils[m.user_id]?.nom || "Membre"}</p>
                <p className="text-xs text-gray-400">Rejoint le {new Date(m.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}