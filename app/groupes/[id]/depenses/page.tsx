"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { authHeaders } from "@/lib/authFetch"

export default function DepensesPartageesPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [user, setUser] = useState<any>(null)
  const [membres, setMembres] = useState<any[]>([])
  const [profils, setProfils] = useState<Record<string, any>>({})
  const [depenses, setDepenses] = useState<any[]>([])
  const [parts, setParts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState("")
  const [montant, setMontant] = useState("")
  const [participants, setParticipants] = useState<Record<string, boolean>>({})
  const [enCours, setEnCours] = useState(false)

  useEffect(() => { charger() }, [])

  async function charger() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    const { data: mb } = await supabase.from("membres_groupe").select("*").eq("groupe_id", id)
    setMembres(mb || [])
    if (mb && mb.length > 0) {
      const ids = mb.map((m: any) => m.user_id)
      const { data: profs } = await supabase.from("profiles").select("id,nom").in("id", ids)
      const map: Record<string, any> = {}
      profs?.forEach((p: any) => { map[p.id] = p })
      setProfils(map)
      setParticipants(prev => {
        const next = { ...prev }
        ids.forEach((uid: string) => { if (!(uid in next)) next[uid] = true })
        return next
      })
    }

    const { data: dep } = await supabase.from("depenses_partagees").select("*").eq("groupe_id", id).order("created_at", { ascending: false })
    setDepenses(dep || [])
    if (dep && dep.length > 0) {
      const { data: prt } = await supabase.from("depenses_partagees_parts").select("*").in("depense_id", dep.map((d: any) => d.id))
      setParts(prt || [])
    } else {
      setParts([])
    }
  }

  async function creerDepense() {
    const total = parseFloat(montant)
    const idsChoisis = Object.entries(participants).filter(([, v]) => v).map(([k]) => k)
    if (!titre.trim() || !total || total <= 0 || idsChoisis.length === 0 || !user) return

    const nbParts = idsChoisis.length
    const partMontant = Math.round((total / nbParts) * 100) / 100

    const { data: nouvelleDepense, error } = await supabase.from("depenses_partagees").insert({
      groupe_id: id, payeur_id: user.id, titre: titre.trim(), montant_total: total,
    }).select().single()
    if (error || !nouvelleDepense) return

    const autresParticipants = idsChoisis.filter(uid => uid !== user.id)
    if (autresParticipants.length > 0) {
      await supabase.from("depenses_partagees_parts").insert(
        autresParticipants.map(uid => ({ depense_id: nouvelleDepense.id, user_id: uid, montant: partMontant }))
      )
    }

    await supabase.from("messages_groupe").insert({
      groupe_id: id, user_id: user.id,
      contenu: `💰 ${profils[user.id]?.nom || "Quelqu'un"} a ajouté une dépense partagée : "${titre.trim()}" — ${total.toFixed(2)} CHF (${partMontant.toFixed(2)} CHF/personne)`,
    })

    setTitre(""); setMontant(""); setShowForm(false)
    charger()
  }

  async function regler(partId: string) {
    setEnCours(true)
    const res = await fetch("/api/stripe/regler-depense", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ partId, retourUrl: window.location.href }),
    })
    const data = await res.json()
    setEnCours(false)
    if (data.url) window.location.href = data.url
    else alert(data.error || "Erreur lors du règlement")
  }

  const mesPartsDues = parts.filter(p => p.user_id === user?.id && p.statut === "du")
  const totalJeDoit = mesPartsDues.reduce((s, p) => s + parseFloat(p.montant), 0)
  const mesDepenses = depenses.filter(d => d.payeur_id === user?.id)
  const partsOnMeDoit = parts.filter(p => mesDepenses.some(d => d.id === p.depense_id) && p.statut === "du")
  const totalOnMeDoit = partsOnMeDoit.reduce((s, p) => s + parseFloat(p.montant), 0)

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 18px 28px'}}>
        <a href={`/groupes/${id}`} style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'8px'}}>← Retour au groupe</a>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:'20px',fontWeight:'500',color:'#fff'}}>Dépenses partagées</div>
          <button onClick={() => setShowForm(!showForm)}
            style={{background:'rgba(255,255,255,0.15)',border:'0.5px solid rgba(255,255,255,0.25)',borderRadius:'10px',padding:'8px 14px',color:'#fff',fontSize:'13px',cursor:'pointer'}}>
            + Nouvelle
          </button>
        </div>
      </div>

      <div style={{padding:'16px 14px'}}>
        {(totalJeDoit > 0 || totalOnMeDoit > 0) && (
          <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
            {totalJeDoit > 0 && (
              <div style={{flex:1,background:'#FFE4E6',border:'0.5px solid #FECDD3',borderRadius:'14px',padding:'12px'}}>
                <div style={{fontSize:'11px',color:'#F43F5E',fontWeight:'500',marginBottom:'4px'}}>Tu dois</div>
                <div style={{fontSize:'18px',fontWeight:'600',color:'#F43F5E'}}>{totalJeDoit.toFixed(2)} CHF</div>
              </div>
            )}
            {totalOnMeDoit > 0 && (
              <div style={{flex:1,background:'#E1F5EE',border:'0.5px solid #A7F3D0',borderRadius:'14px',padding:'12px'}}>
                <div style={{fontSize:'11px',color:'#10B981',fontWeight:'500',marginBottom:'4px'}}>On te doit</div>
                <div style={{fontSize:'18px',fontWeight:'600',color:'#10B981'}}>{totalOnMeDoit.toFixed(2)} CHF</div>
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div style={{background:'#EEF5FF',borderRadius:'14px',padding:'14px',marginBottom:'14px',border:'0.5px solid #DCE9FF'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>Nouvelle dépense partagée</div>
            <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Courses, Resto, Essence..."
              style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px',fontSize:'16px',color:'#1a1a2e',background:'#fff',marginBottom:'10px',boxSizing:'border-box'}}/>
            <input value={montant} onChange={e => setMontant(e.target.value)} type="number" min="0" step="0.05" placeholder="Montant total (CHF)"
              style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px',fontSize:'16px',color:'#1a1a2e',background:'#fff',marginBottom:'10px',boxSizing:'border-box'}}/>
            <div style={{fontSize:'12px',color:'#666',marginBottom:'6px'}}>Partagée entre (montant divisé également)</div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px',marginBottom:'12px'}}>
              {membres.map((m: any) => (
                <label key={m.user_id} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'#1a1a2e'}}>
                  <input type="checkbox" checked={!!participants[m.user_id]}
                    onChange={e => setParticipants(prev => ({ ...prev, [m.user_id]: e.target.checked }))}/>
                  {profils[m.user_id]?.nom || 'Membre'}{m.user_id === user?.id ? ' (toi)' : ''}
                </label>
              ))}
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={creerDepense} style={{flex:1,background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'10px',padding:'10px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>Créer</button>
              <button onClick={() => setShowForm(false)} style={{flex:1,background:'#fff',color:'#666',border:'0.5px solid #E8F1FF',borderRadius:'10px',padding:'10px',fontSize:'13px',cursor:'pointer'}}>Annuler</button>
            </div>
          </div>
        )}

        {depenses.length === 0 && (
          <div style={{textAlign:'center',padding:'48px 0'}}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" style={{margin:'0 auto 12px',display:'block'}}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <div style={{fontSize:'14px',color:'#aaa'}}>Aucune dépense partagée pour l'instant</div>
            <div style={{fontSize:'12px',color:'#ccc',marginTop:'4px'}}>Ajoute une note à partager avec le groupe</div>
          </div>
        )}

        {depenses.map(d => {
          const partsDepense = parts.filter(p => p.depense_id === d.id)
          const jeSuisPayeur = d.payeur_id === user?.id
          const maPart = partsDepense.find(p => p.user_id === user?.id)
          return (
            <div key={d.id} style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'14px',padding:'14px',marginBottom:'10px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                <div>
                  <div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e'}}>{d.titre}</div>
                  <div style={{fontSize:'11px',color:'#aaa'}}>Payé par {profils[d.payeur_id]?.nom || 'Membre'} · {new Date(d.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
                </div>
                <div style={{fontSize:'16px',fontWeight:'600',color:'#1a1a2e'}}>{parseFloat(d.montant_total).toFixed(2)} CHF</div>
              </div>

              {jeSuisPayeur && partsDepense.map(p => (
                <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',fontSize:'12px',color:'#666'}}>
                  <span>{profils[p.user_id]?.nom || 'Membre'} doit {parseFloat(p.montant).toFixed(2)} CHF</span>
                  <span style={{color: p.statut === 'regle' ? '#10B981' : '#aaa',fontWeight:'500'}}>{p.statut === 'regle' ? '✓ Réglé' : 'En attente'}</span>
                </div>
              ))}

              {!jeSuisPayeur && maPart && (
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'6px'}}>
                  <span style={{fontSize:'12px',color:'#666'}}>Ta part : {parseFloat(maPart.montant).toFixed(2)} CHF</span>
                  {maPart.statut === 'regle' ? (
                    <span style={{fontSize:'12px',color:'#10B981',fontWeight:'500'}}>✓ Réglé</span>
                  ) : (
                    <button disabled={enCours} onClick={() => regler(maPart.id)}
                      style={{background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'99px',padding:'6px 16px',fontSize:'12px',fontWeight:'500',cursor:'pointer'}}>
                      Rembourser
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}
