"use client"
import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function GroupePage() {
  const { id } = useParams()
  const [groupe, setGroupe] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [projets, setProjets] = useState<any[]>([])
  const [membres, setMembres] = useState<any[]>([])
  const [profils, setProfils] = useState<any>({})
  const [user, setUser] = useState<any>(null)
  const [contenu, setContenu] = useState("")
  const [onglet, setOnglet] = useState("discussion")
  const [estMembre, setEstMembre] = useState(false)
  const [lienInvitation, setLienInvitation] = useState("")
  const [copie, setCopie] = useState(false)
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [messageActif, setMessageActif] = useState<any>(null)
  const [editionId, setEditionId] = useState<string|null>(null)
  const [editionTexte, setEditionTexte] = useState("")
  const messagesEndRef = useRef<any>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: g } = await supabase.from("groupes").select("*").eq("id", id).single()
      setGroupe(g)
      const { data: m } = await supabase.from("messages_groupe").select("*").eq("groupe_id", id).order("created_at", { ascending: true })
      setMessages(m || [])
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
    }
    charger()

    channelRef.current = supabase
      .channel('messages-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_groupe', filter: 'groupe_id=eq.' + id },
        (payload) => setMessages(prev => [...prev, payload.new]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages_groupe', filter: 'groupe_id=eq.' + id },
        (payload) => setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages_groupe', filter: 'groupe_id=eq.' + id },
        (payload) => setMessages(prev => prev.filter(m => m.id !== payload.old.id)))
      .subscribe()

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
    await supabase.from("messages_groupe").insert({ groupe_id: id, user_id: user.id, contenu })
    setContenu("")
  }

  async function supprimerMessage(messageId: string) {
    await supabase.from("messages_groupe").delete().eq("id", messageId)
    setMessageActif(null)
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
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="text-lg font-medium text-gray-900 mb-2">{groupe.nom}</h1>
          <p className="text-sm text-gray-400 mb-6">Ce groupe est privé. Tu as besoin d'une invitation pour y accéder.</p>
          <a href="/groupes" className="text-blue-500 text-sm font-medium">← Retour aux groupes</a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <div className="bg-white border-b border-blue-50 px-5 py-4 flex items-center justify-between">
        <a href="/groupes" className="text-gray-400 text-sm">← Retour</a>
        <div className="text-center">
          <p className="text-base font-medium text-gray-900">{groupe.nom}</p>
          <p className="text-xs text-gray-400">{membres.length} membres</p>
        </div>
        <div style={{position:'relative'}}>
          <button onClick={() => setMenuOuvert(!menuOuvert)}
            style={{width:'36px',height:'36px',borderRadius:'50%',background:'#F8FBFF',border:'1px solid #E8F1FF',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'18px',color:'#2B7FFF'}}>
            ⋯
          </button>
          {menuOuvert && (
            <>
              <div onClick={() => setMenuOuvert(false)} style={{position:'fixed',inset:0,zIndex:10}}></div>
              <div style={{position:'absolute',top:'44px',right:0,background:'#fff',borderRadius:'16px',boxShadow:'0 8px 30px rgba(0,0,0,0.12)',border:'0.5px solid #E8F1FF',overflow:'hidden',zIndex:20,minWidth:'200px'}}>
                <a href={'/groupes/' + id + '/appel'} style={{textDecoration:'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderBottom:'0.5px solid #F0F4FA'}}>
                    <span style={{fontSize:'18px'}}>📞</span>
                    <span style={{fontSize:'14px',color:'#1a1a2e',fontWeight:'500'}}>Lancer un appel</span>
                  </div>
                </a>
                <div onClick={() => { setOnglet('jeux'); setMenuOuvert(false) }} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderBottom:'0.5px solid #F0F4FA',cursor:'pointer'}}>
                  <span style={{fontSize:'18px'}}>🎮</span>
                  <span style={{fontSize:'14px',color:'#1a1a2e',fontWeight:'500'}}>Jouer</span>
                </div>
                <div onClick={genererInvitation} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',cursor:'pointer'}}>
                  <span style={{fontSize:'18px'}}>✉️</span>
                  <span style={{fontSize:'14px',color:'#1a1a2e',fontWeight:'500'}}>Inviter quelqu'un</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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

      <div className="flex border-b border-blue-50" style={{overflowX:"auto",whiteSpace:"nowrap"}}>
        <button onClick={() => setOnglet("discussion")}
          className={`flex-1 py-3 text-sm font-medium ${onglet === "discussion" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400"}`}>
          💬 Discussion
        </button>
        <button onClick={() => setOnglet("projets")}
          className={`flex-1 py-3 text-sm font-medium ${onglet === "projets" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400"}`}>
          📌 Projets ({projets.length})
        </button>
        <button onClick={() => setOnglet("jeux")}
          className={`flex-1 py-3 text-sm font-medium ${onglet === "jeux" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400"}`}>
          🎮 Jeux
        </button>
        <button onClick={() => setOnglet("membres")}
          className={`flex-1 py-3 text-sm font-medium ${onglet === "membres" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400"}`}>
          👥 Membres ({membres.length})
        </button>
      </div>

      {onglet === "discussion" && (
        <div className="flex flex-col flex-1">
          <div className="flex-1 px-5 py-4 overflow-y-auto" style={{maxHeight:'60vh'}}>
            {messagesAffiches.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-sm">Sois le premier à écrire dans ce groupe !</p>
              </div>
            )}
            {messagesAffiches.map((m: any) => {
              const estMoi = m.user_id === user?.id
              const enEdition = editionId === m.id
              return (
                <div key={m.id} className={`flex gap-2 mb-3 ${estMoi ? "flex-row-reverse" : ""}`} style={{position:'relative'}}>
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                    {(profils[m.user_id]?.nom || "?")[0].toUpperCase()}
                  </div>
                  <div style={{maxWidth:'75%'}}>
                    {enEdition ? (
                      <div style={{background:'#fff',border:'1px solid #2B7FFF',borderRadius:'16px',padding:'8px 12px'}}>
                        <input value={editionTexte} onChange={e => setEditionTexte(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && sauverEdition()}
                          style={{width:'100%',border:'none',outline:'none',fontSize:'14px',color:'#1a1a2e'}} autoFocus/>
                        <div style={{display:'flex',gap:'8px',marginTop:'6px'}}>
                          <button onClick={sauverEdition} style={{fontSize:'11px',color:'#2B7FFF',background:'none',border:'none',cursor:'pointer',fontWeight:'500'}}>Enregistrer</button>
                          <button onClick={() => setEditionId(null)} style={{fontSize:'11px',color:'#aaa',background:'none',border:'none',cursor:'pointer'}}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <div onTouchStart={() => estMoi && setMessageActif(messageActif === m.id ? null : m.id)}
                        onClick={() => estMoi && setMessageActif(messageActif === m.id ? null : m.id)}
                        className={`px-4 py-2 rounded-2xl text-sm ${estMoi ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"}`}
                        style={{cursor: estMoi ? 'pointer' : 'default'}}>
                        {m.contenu} {m.modifie && <span style={{fontSize:'10px',opacity:0.6}}>(modifié)</span>}
                        <div className={`text-xs mt-1 ${estMoi ? "text-blue-100" : "text-gray-400"}`}>
                          {(() => { const d = new Date(m.created_at); d.setHours(d.getHours() + 2); return d.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) })()}
                        </div>
                      </div>
                    )}
                    {messageActif === m.id && !enEdition && (
                      <div style={{display:'flex',gap:'8px',marginTop:'6px',justifyContent: estMoi ? 'flex-end' : 'flex-start'}}>
                        <button onClick={() => { setEditionId(m.id); setEditionTexte(m.contenu); setMessageActif(null) }}
                          style={{fontSize:'11px',background:'#F8FBFF',color:'#2B7FFF',border:'1px solid #E8F1FF',borderRadius:'99px',padding:'4px 10px',cursor:'pointer'}}>
                          ✏️ Modifier
                        </button>
                        <button onClick={() => supprimerMessage(m.id)}
                          style={{fontSize:'11px',background:'#FFF5F5',color:'#F43F5E',border:'1px solid #FECDD3',borderRadius:'99px',padding:'4px 10px',cursor:'pointer'}}>
                          🗑️ Supprimer
                        </button>
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
              <p className="text-3xl mb-2">📭</p>
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

      {onglet === "jeux" && (
        <div style={{padding:'16px 18px'}}>
          <a href={'/groupes/' + id + '/puissance4'} style={{textDecoration:'none'}}>
            <div style={{background:'linear-gradient(135deg,#1a1a2e,#16213e)',borderRadius:'20px',padding:'20px',marginBottom:'12px',border:'1px solid rgba(43,127,255,0.3)',display:'flex',alignItems:'center',gap:'16px'}}>
              <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'rgba(43,127,255,0.3)',border:'1px solid rgba(43,127,255,0.5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px'}}>🔴</div>
              <div>
                <div style={{color:'#fff',fontWeight:'500',fontSize:'16px',marginBottom:'4px'}}>Puissance 4</div>
                <div style={{color:'rgba(255,255,255,0.5)',fontSize:'12px'}}>Joue contre un membre en temps réel</div>
              </div>
              <span style={{marginLeft:'auto',color:'rgba(255,255,255,0.4)',fontSize:'20px'}}>›</span>
            </div>
          </a>
          <a href={'/groupes/' + id + '/quiz'} style={{textDecoration:'none'}}>
            <div style={{background:'linear-gradient(135deg,#46178f,#7c3aed)',borderRadius:'20px',padding:'20px',marginBottom:'12px',border:'1px solid rgba(168,85,247,0.4)',display:'flex',alignItems:'center',gap:'16px'}}>
              <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'rgba(168,85,247,0.3)',border:'1px solid rgba(168,85,247,0.5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px'}}>🗺️</div>
              <div>
                <div style={{color:'#fff',fontWeight:'500',fontSize:'16px',marginBottom:'4px'}}>Quiz</div>
                <div style={{color:'rgba(255,255,255,0.5)',fontSize:'12px'}}>Crée et joue des quiz avec le groupe</div>
              </div>
              <span style={{marginLeft:'auto',color:'rgba(255,255,255,0.4)',fontSize:'20px'}}>›</span>
            </div>
          </a>
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
