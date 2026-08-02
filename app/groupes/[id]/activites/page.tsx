"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { syncActivitesGroupeVersCalendrier } from "@/lib/syncActivites"

const COULEURS = ["#8B5CF6", "#2B7FFF", "#10B981", "#F43F5E", "#D4A843", "#EC4899"]

export default function ActivitesGroupe() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const [groupe, setGroupe] = useState<any>(null)
  const [activites, setActivites] = useState<any[]>([])
  const [profils, setProfils] = useState<any>({})
  const [user, setUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState("")
  const [description, setDescription] = useState("")
  const [lieu, setLieu] = useState("")
  const [date, setDate] = useState("")
  const [heure, setHeure] = useState("")
  const [couleur, setCouleur] = useState(COULEURS[0])
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: g } = await supabase.from("groupes").select("*").eq("id", id).single()
      setGroupe(g)
      if (user) {
        await syncActivitesGroupeVersCalendrier(user.id)
      }
      await charger()
    }
    init()
  }, [id])

  async function charger() {
    const { data: a } = await supabase.from("activites_groupe").select("*").eq("groupe_id", id).order("date", { ascending: true })
    setActivites(a || [])

    const { data: membres } = await supabase.from("membres_groupe").select("user_id, profiles(prenom, nom)").eq("groupe_id", id)
    const p: any = {}
    membres?.forEach((m: any) => { p[m.user_id] = m.profiles?.prenom || "Membre" })
    setProfils(p)
  }

  async function creerActivite() {
    if (!titre.trim() || !date) { setMessage("Un titre et une date sont nécessaires."); return }
    if (!user) return

    const { data: nouvelleActivite, error } = await supabase.from("activites_groupe").insert({
      groupe_id: id, titre, description, lieu, date, heure, couleur, created_by: user.id
    }).select().single()

    if (error) { setMessage("Erreur : " + error.message); return }

    await syncActivitesGroupeVersCalendrier(user.id)

    const { data: membres } = await supabase.from("membres_groupe").select("user_id").eq("groupe_id", id)
    if (membres) {
      const { data: profil } = await supabase.from("profiles").select("nom, prenom").eq("id", user.id).single()
      const nomAffiche = profil?.prenom || profil?.nom || "Un membre"
      for (const mb of membres.filter((m: any) => m.user_id !== user.id)) {
        await supabase.from("notifications").insert({
          user_id: mb.user_id,
          type: "activite",
          titre: groupe?.nom || "Groupe",
          contenu: `${nomAffiche} a planifié : ${titre}`,
          lien: `/groupes/${id}/activites`
        })
      }
    }

    setTitre(""); setDescription(""); setLieu(""); setDate(""); setHeure(""); setCouleur(COULEURS[0])
    setShowForm(false); setMessage("")
    charger()
  }

  async function supprimerActivite(activiteId: string) {
    if (!confirm("Supprimer cette activité ? Elle sera aussi retirée des calendriers.")) return
    await supabase.from("activites_groupe").delete().eq("id", activiteId)
    charger()
  }

  const aujourdHui = new Date(); aujourdHui.setHours(0,0,0,0)
  const activitesAVenir = activites.filter(a => new Date(a.date) >= aujourdHui)
  const activitesPassees = activites.filter(a => new Date(a.date) < aujourdHui)

  const inp = {width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px',fontSize:'16px',color:'#1a1a2e',background:'#fff',marginBottom:'8px',boxSizing:'border-box' as const}

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 18px 28px'}}>
        <a href={`/groupes/${id}`} style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'8px'}}>← Retour au groupe</a>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:'20px',fontWeight:'500',color:'#fff'}}>Activités</div>
          <button onClick={() => setShowForm(!showForm)}
            style={{background:'rgba(255,255,255,0.15)',border:'0.5px solid rgba(255,255,255,0.25)',borderRadius:'10px',padding:'8px 14px',color:'#fff',fontSize:'13px',cursor:'pointer'}}>
            + Planifier
          </button>
        </div>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginTop:'4px'}}>Se synchronise automatiquement avec le calendrier de chaque membre</div>
      </div>

      <div style={{padding:'16px 14px'}}>
        {showForm && (
          <div style={{background:'#EEF5FF',borderRadius:'14px',padding:'14px',marginBottom:'14px',border:'0.5px solid #DCE9FF'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>Nouvelle activité</div>
            <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Raclette chez Sam, Randonnée..." style={inp}/>
            <input value={lieu} onChange={e => setLieu(e.target.value)} placeholder="Lieu (optionnel)" style={inp}/>
            <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{...inp,marginBottom:0,flex:1}}/>
              <input type="time" value={heure} onChange={e => setHeure(e.target.value)} style={{...inp,marginBottom:0,flex:1}}/>
            </div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optionnel)" rows={2}
              style={{...inp,resize:'none' as const}}/>
            <div style={{fontSize:'11px',color:'#666',marginBottom:'6px'}}>Couleur</div>
            <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
              {COULEURS.map(c => (
                <button key={c} onClick={() => setCouleur(c)}
                  style={{width:'26px',height:'26px',borderRadius:'50%',background:c,border: couleur === c ? '2px solid #1a1a2e' : '2px solid transparent',cursor:'pointer'}}/>
              ))}
            </div>
            {message && <div style={{fontSize:'12px',color:'#F43F5E',marginBottom:'8px'}}>{message}</div>}
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={creerActivite} style={{flex:1,background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'10px',padding:'10px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>Planifier</button>
              <button onClick={() => setShowForm(false)} style={{flex:1,background:'#fff',color:'#666',border:'0.5px solid #E8F1FF',borderRadius:'10px',padding:'10px',fontSize:'13px',cursor:'pointer'}}>Annuler</button>
            </div>
          </div>
        )}

        {activitesAVenir.length === 0 && activitesPassees.length === 0 && (
          <div style={{textAlign:'center',padding:'48px 0'}}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" style={{margin:'0 auto 12px',display:'block'}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <div style={{fontSize:'14px',color:'#aaa'}}>Aucune activité planifiée</div>
            <div style={{fontSize:'12px',color:'#ccc',marginTop:'4px'}}>Planifie un moment avec le groupe</div>
          </div>
        )}

        {activitesAVenir.length > 0 && (
          <>
            <div style={{fontSize:'11px',color:'#aaa',fontWeight:'500',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'8px'}}>À venir</div>
            {activitesAVenir.map(a => (
              <div key={a.id} style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'14px',padding:'14px',marginBottom:'10px',display:'flex',gap:'12px'}}>
                <div style={{width:'4px',borderRadius:'99px',background:a.couleur,flexShrink:0}}></div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e'}}>{a.titre}</div>
                    <button onClick={() => supprimerActivite(a.id)}
                      style={{width:'24px',height:'24px',borderRadius:'50%',background:'#F8FBFF',border:'0.5px solid #E8F1FF',cursor:'pointer',color:'#aaa',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div style={{fontSize:'12px',color:'#666',marginTop:'2px'}}>
                    {new Date(a.date).toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long'})}
                    {a.heure && ` · ${a.heure}`}
                    {a.lieu && ` · ${a.lieu}`}
                  </div>
                  {a.description && <div style={{fontSize:'12px',color:'#aaa',marginTop:'4px'}}>{a.description}</div>}
                  <div style={{fontSize:'11px',color:'#ccc',marginTop:'6px'}}>Planifié par {profils[a.created_by] || 'un membre'}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {activitesPassees.length > 0 && (
          <>
            <div style={{fontSize:'11px',color:'#aaa',fontWeight:'500',textTransform:'uppercase',letterSpacing:'.05em',margin:'16px 0 8px'}}>Passées</div>
            {activitesPassees.map(a => (
              <div key={a.id} style={{background:'#F8FBFF',border:'0.5px solid #E8F1FF',borderRadius:'14px',padding:'14px',marginBottom:'8px',opacity:0.6}}>
                <div style={{fontSize:'13px',color:'#1a1a2e'}}>{a.titre}</div>
                <div style={{fontSize:'11px',color:'#aaa',marginTop:'2px'}}>{new Date(a.date).toLocaleDateString('fr-FR', {day:'numeric', month:'long'})}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  )
}
