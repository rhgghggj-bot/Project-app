"use client"
import Link from "next/link"
import Tutorial from "../components/Tutorial"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { ouvrirConversationPrivee } from "@/lib/dm"

function formaterHeure(dateStr: string) {
  const d = new Date(dateStr)
  d.setHours(d.getHours() + 2)
  const maintenant = new Date()
  const memeJour = d.toDateString() === maintenant.toDateString()
  if (memeJour) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const hier = new Date(maintenant); hier.setDate(hier.getDate() - 1)
  if (d.toDateString() === hier.toDateString()) return "Hier"
  const joursDiff = Math.floor((maintenant.getTime() - d.getTime()) / 86400000)
  if (joursDiff < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function Groupes() {
  const [items, setItems] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [message, setMessage] = useState("")

  const [composeOuvert, setComposeOuvert] = useState(false)
  const [recherche, setRecherche] = useState("")
  const [resultats, setResultats] = useState<any[]>([])
  const [selectionnes, setSelectionnes] = useState<any[]>([])
  const [nomGroupe, setNomGroupe] = useState("")
  const [enCreation, setEnCreation] = useState(false)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) { setItems([]); return }

      const { data: membres } = await supabase.from("membres_groupe").select("groupe_id").eq("user_id", user.id)
      const idsGroupes = membres?.map((m: any) => m.groupe_id) || []
      if (idsGroupes.length === 0) { setItems([]); return }

      const [{ data }, { data: tousMessages }, { data: membresDesGroupes }] = await Promise.all([
        supabase.from("groupes").select("*").in("id", idsGroupes).order("created_at", { ascending: false }),
        supabase.from("messages_groupe").select("groupe_id,contenu,created_at,user_id").in("groupe_id", idsGroupes).order("created_at", { ascending: false }),
        supabase.from("membres_groupe").select("groupe_id,user_id").in("groupe_id", idsGroupes),
      ])
      const tousGroupes = data || []
      const dernierMessageParGroupe: Record<string, any> = {}
      tousMessages?.forEach((m: any) => { if (!dernierMessageParGroupe[m.groupe_id]) dernierMessageParGroupe[m.groupe_id] = m })

      const idsAutresDM: string[] = []
      const itemsBruts: any[] = []
      for (const g of tousGroupes) {
        if (g.est_dm) {
          const autre = (membresDesGroupes || []).find((m: any) => m.groupe_id === g.id && m.user_id !== user.id)
          if (autre) idsAutresDM.push(autre.user_id)
          itemsBruts.push({ ...g, type: 'dm', autreId: autre?.user_id })
        } else {
          itemsBruts.push({ ...g, type: 'groupe' })
        }
      }

      let profilsMap: any = {}
      if (idsAutresDM.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id,nom,avatar_url").in("id", idsAutresDM)
        profs?.forEach((p: any) => { profilsMap[p.id] = p })
      }

      const itemsFinal = itemsBruts.map(it => {
        const dernier = dernierMessageParGroupe[it.id]
        return {
          ...it,
          profil: it.type === 'dm' ? profilsMap[it.autreId] : null,
          dernierMessage: dernier?.contenu || null,
          dernierTemps: dernier?.created_at || it.created_at
        }
      }).sort((a, b) => new Date(b.dernierTemps).getTime() - new Date(a.dernierTemps).getTime())

      setItems(itemsFinal)
    }
    charger()
  }, [])

  useEffect(() => {
    async function rechercher() {
      if (!recherche.trim() || !user) { setResultats([]); return }
      const { data } = await supabase.from("profiles").select("id,nom,avatar_url").ilike("nom", `%${recherche.trim()}%`).neq("id", user.id).limit(15)
      setResultats((data || []).filter((p: any) => !selectionnes.some(s => s.id === p.id)))
    }
    const t = setTimeout(rechercher, 250)
    return () => clearTimeout(t)
  }, [recherche, selectionnes, user])

  function ajouterSelection(p: any) {
    setSelectionnes(prev => [...prev, p])
    setRecherche("")
    setResultats([])
  }

  function retirerSelection(id: string) {
    setSelectionnes(prev => prev.filter(p => p.id !== id))
  }

  function fermerCompose() {
    setComposeOuvert(false)
    setSelectionnes([])
    setRecherche("")
    setResultats([])
    setNomGroupe("")
  }

  async function demarrerDiscussion() {
    if (!user || selectionnes.length === 0) return
    setEnCreation(true)

    if (selectionnes.length === 1) {
      const idConv = await ouvrirConversationPrivee(supabase, user.id, selectionnes[0].id)
      setEnCreation(false)
      if (idConv) window.location.href = "/groupes/" + idConv
      return
    }

    if (!nomGroupe.trim()) { setEnCreation(false); setMessage("Donne un nom au groupe"); return }
    const { data, error } = await supabase.from("groupes").insert({
      nom: nomGroupe.trim(), description: "", created_by: user.id
    }).select().single()
    if (error || !data) { setEnCreation(false); setMessage("Erreur : " + (error?.message || "")); return }

    await supabase.from("membres_groupe").insert([
      { groupe_id: data.id, user_id: user.id },
      ...selectionnes.map(p => ({ groupe_id: data.id, user_id: p.id }))
    ])
    setEnCreation(false)
    window.location.href = `/groupes/${data.id}`
  }

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',padding:'20px 18px 24px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h1 style={{fontSize:'28px',fontWeight:'600',color:'#fff',margin:0}}>Discussions</h1>
          <button onClick={() => setComposeOuvert(true)}
            style={{background:'#fff',border:'none',color:'#1a3a6e',borderRadius:'99px',width:'48px',height:'48px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 4px 14px rgba(0,0,0,0.25)'}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a3a6e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
          </button>
        </div>
      </div>

      <div>
        {items.map((it, i) => {
          const couleurGroupe = ['#2B7FFF','#10B981','#D4A843','#8B5CF6','#F43F5E'][i % 5]
          const nom = it.type === 'dm' ? (it.profil?.nom || 'Membre') : it.nom
          const avatarUrl = it.type === 'dm' ? it.profil?.avatar_url : null
          const apercu = it.dernierMessage ? it.dernierMessage : (it.type === 'dm' ? 'Dites bonjour 👋' : (it.description || 'Nouveau groupe'))
          return (
            <Link key={it.id} href={'/groupes/'+it.id} transitionTypes={['nav-forward']} style={{textDecoration:'none',display:'block'}}>
              <div className="active:bg-gray-50" style={{display:'flex',alignItems:'center',gap:'14px',padding:'12px 18px',cursor:'pointer',transition:'background 0.1s'}}>
                <div style={{position:'relative',flexShrink:0}}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={nom} style={{width:'56px',height:'56px',borderRadius:'50%',objectFit:'cover'}}/>
                  ) : it.type === 'dm' ? (
                    <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'linear-gradient(135deg,#2B7FFF,#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'19px',fontWeight:'600'}}>
                      {nom[0]?.toUpperCase()}
                    </div>
                  ) : (
                    <div style={{width:'56px',height:'56px',borderRadius:'50%',background:couleurGroupe+'1A',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={couleurGroupe} strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                  )}
                  {it.type === 'groupe' && (
                    <div style={{position:'absolute',bottom:'-2px',right:'-2px',width:'20px',height:'20px',borderRadius:'50%',background:couleurGroupe,border:'2px solid #fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    </div>
                  )}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'15px',fontWeight:'600',color:'#1a1a2e',marginBottom:'2px'}}>{nom}</div>
                  <div style={{fontSize:'13px',color:'#999',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{apercu}</div>
                </div>
                <div style={{fontSize:'12px',color:'#bbb',flexShrink:0}}>{formaterHeure(it.dernierTemps)}</div>
              </div>
            </Link>
          )
        })}

        {items.length === 0 && (
          <div style={{textAlign:'center',padding:'60px 20px'}}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" style={{margin:'0 auto 12px',display:'block'}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <div style={{fontSize:'14px',color:'#aaa'}}>Aucune discussion pour l'instant</div>
            <div style={{fontSize:'12px',color:'#ccc',marginTop:'4px'}}>Touche le + en haut pour écrire à quelqu'un</div>
          </div>
        )}
      </div>

      {composeOuvert && (
        <div style={{position:'fixed',inset:0,background:'#fff',zIndex:300,display:'flex',flexDirection:'column'}}>
          <div style={{padding:'16px 18px',borderBottom:'0.5px solid #E8F1FF',display:'flex',alignItems:'center',gap:'14px'}}>
            <button onClick={fermerCompose} style={{background:'none',border:'none',fontSize:'14px',color:'#2B7FFF',cursor:'pointer',padding:0}}>Annuler</button>
            <div style={{fontSize:'15px',fontWeight:'600',color:'#1a1a2e',flex:1,textAlign:'center',marginRight:'40px'}}>Nouvelle discussion</div>
          </div>

          <div style={{padding:'14px 18px',borderBottom:'0.5px solid #E8F1FF'}}>
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}}>
              {selectionnes.map(p => (
                <span key={p.id} style={{display:'flex',alignItems:'center',gap:'7px',background:'#2B7FFF',color:'#fff',borderRadius:'99px',padding:'5px 8px 5px 5px',fontSize:'14px',fontWeight:'600',boxShadow:'0 2px 6px rgba(43,127,255,0.3)'}}>
                  <span style={{width:'22px',height:'22px',borderRadius:'50%',background:'rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700'}}>{(p.nom || 'M')[0]?.toUpperCase()}</span>
                  {p.nom || 'Membre'}
                  <button onClick={() => retirerSelection(p.id)} style={{background:'rgba(255,255,255,0.25)',border:'none',color:'#fff',cursor:'pointer',fontSize:'13px',lineHeight:1,padding:0,width:'18px',height:'18px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
                </span>
              ))}
              <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder={selectionnes.length ? "Ajouter…" : "À :"}
                style={{flex:1,minWidth:'100px',border:'none',outline:'none',fontSize:'16px',padding:'6px 0'}}/>
            </div>
          </div>

          <div style={{flex:1,overflowY:'auto'}}>
            {resultats.map(p => (
              <div key={p.id} onClick={() => ajouterSelection(p)} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 18px',cursor:'pointer',borderBottom:'0.5px solid #F5F8FC'}}>
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.nom} style={{width:'44px',height:'44px',borderRadius:'50%',objectFit:'cover'}}/>
                ) : (
                  <div style={{width:'44px',height:'44px',borderRadius:'50%',background:'linear-gradient(135deg,#2B7FFF,#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'15px',fontWeight:'600'}}>
                    {(p.nom || "M")[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{fontSize:'14px',color:'#1a1a2e',fontWeight:'500'}}>{p.nom || "Membre"}</div>
              </div>
            ))}
            {recherche.trim() && resultats.length === 0 && (
              <div style={{textAlign:'center',padding:'24px',color:'#aaa',fontSize:'13px'}}>Personne trouvé</div>
            )}
          </div>

          {selectionnes.length > 1 && (
            <div style={{padding:'12px 18px',borderTop:'0.5px solid #E8F1FF'}}>
              <input value={nomGroupe} onChange={e => setNomGroupe(e.target.value)} placeholder="Nom du groupe"
                style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px',fontSize:'14px',boxSizing:'border-box'}}/>
            </div>
          )}

          {message && <div style={{padding:'0 18px 8px',fontSize:'12px',color:'#F43F5E'}}>{message}</div>}

          {selectionnes.length > 0 && (
            <div style={{padding:'14px 18px 22px',background:'#fff',boxShadow:'0 -4px 14px rgba(0,0,0,0.06)'}}>
              <button onClick={demarrerDiscussion} disabled={enCreation}
                style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'14px',padding:'16px',fontSize:'16px',fontWeight:'700',cursor: enCreation ? 'default' : 'pointer',opacity: enCreation ? 0.6 : 1,boxShadow:'0 6px 18px rgba(43,127,255,0.4)'}}>
                {!enCreation && (
                  selectionnes.length === 1 ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  )
                )}
                {enCreation ? 'Création…' : selectionnes.length === 1 ? 'Discuter avec ' + (selectionnes[0].nom || 'ce membre') : 'Créer le groupe'}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
