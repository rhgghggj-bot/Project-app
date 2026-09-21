"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function ObjectifsGroupePage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [user, setUser] = useState<any>(null)
  const [profils, setProfils] = useState<Record<string, any>>({})
  const [objectifs, setObjectifs] = useState<any[]>([])
  const [contributions, setContributions] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState("")
  const [montantCible, setMontantCible] = useState("")
  const [dateLimite, setDateLimite] = useState("")
  const [contribuerA, setContribuerA] = useState<string | null>(null)
  const [montantContrib, setMontantContrib] = useState("")

  useEffect(() => { charger() }, [])

  async function charger() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    const { data: mb } = await supabase.from("membres_groupe").select("user_id").eq("groupe_id", id)
    if (mb && mb.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id,nom").in("id", mb.map((m: any) => m.user_id))
      const map: Record<string, any> = {}
      profs?.forEach((p: any) => { map[p.id] = p })
      setProfils(map)
    }

    const { data: obj } = await supabase.from("objectifs_groupe").select("*").eq("groupe_id", id).order("created_at", { ascending: false })
    setObjectifs(obj || [])
    if (obj && obj.length > 0) {
      const { data: contribs } = await supabase.from("objectifs_groupe_contributions").select("*").in("objectif_id", obj.map((o: any) => o.id))
      setContributions(contribs || [])
    } else {
      setContributions([])
    }
  }

  async function creerObjectif() {
    const cible = parseFloat(montantCible)
    if (!titre.trim() || !cible || cible <= 0 || !user) return

    await supabase.from("objectifs_groupe").insert({
      groupe_id: id, titre: titre.trim(), montant_cible: cible,
      date_limite: dateLimite || null, created_by: user.id,
    })

    await supabase.from("messages_groupe").insert({
      groupe_id: id, user_id: user.id,
      contenu: `🎯 ${profils[user.id]?.nom || "Quelqu'un"} a lancé un objectif de groupe : "${titre.trim()}" — ${cible.toFixed(0)} CHF`,
    })

    setTitre(""); setMontantCible(""); setDateLimite(""); setShowForm(false)
    charger()
  }

  async function ajouterContribution(objectifId: string) {
    const montant = parseFloat(montantContrib)
    if (!montant || montant <= 0 || !user) return

    await supabase.from("objectifs_groupe_contributions").insert({
      objectif_id: objectifId, user_id: user.id, montant,
    })

    const objectif = objectifs.find(o => o.id === objectifId)
    await supabase.from("messages_groupe").insert({
      groupe_id: id, user_id: user.id,
      contenu: `💰 ${profils[user.id]?.nom || "Quelqu'un"} a mis ${montant.toFixed(0)} CHF dans l'objectif "${objectif?.titre}"`,
    })

    setMontantContrib(""); setContribuerA(null)
    charger()
  }

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 18px 28px'}}>
        <a href={`/groupes/${id}`} style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'8px'}}>← Retour au groupe</a>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:'20px',fontWeight:'500',color:'#fff'}}>Objectifs de groupe</div>
          <button onClick={() => setShowForm(!showForm)}
            style={{background:'rgba(255,255,255,0.15)',border:'0.5px solid rgba(255,255,255,0.25)',borderRadius:'10px',padding:'8px 14px',color:'#fff',fontSize:'13px',cursor:'pointer'}}>
            + Nouveau
          </button>
        </div>
      </div>

      <div style={{padding:'16px 14px'}}>
        {showForm && (
          <div style={{background:'#FDF3DC',borderRadius:'14px',padding:'14px',marginBottom:'14px',border:'0.5px solid #F0D88A'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>Nouvel objectif</div>
            <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Voyage à Barcelone, Cadeau..."
              style={{width:'100%',border:'1px solid #F0D88A',borderRadius:'10px',padding:'10px 12px',fontSize:'16px',color:'#1a1a2e',background:'#fff',marginBottom:'10px',boxSizing:'border-box'}}/>
            <input value={montantCible} onChange={e => setMontantCible(e.target.value)} type="number" min="0" step="10" placeholder="Montant visé (CHF)"
              style={{width:'100%',border:'1px solid #F0D88A',borderRadius:'10px',padding:'10px 12px',fontSize:'16px',color:'#1a1a2e',background:'#fff',marginBottom:'10px',boxSizing:'border-box'}}/>
            <div style={{fontSize:'12px',color:'#8a6d1a',marginBottom:'6px'}}>Date limite (optionnel)</div>
            <input value={dateLimite} onChange={e => setDateLimite(e.target.value)} type="date"
              style={{width:'100%',border:'1px solid #F0D88A',borderRadius:'10px',padding:'10px 12px',fontSize:'16px',color:'#1a1a2e',background:'#fff',marginBottom:'12px',boxSizing:'border-box'}}/>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={creerObjectif} style={{flex:1,background:'#D4A843',color:'#fff',border:'none',borderRadius:'10px',padding:'10px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>Créer</button>
              <button onClick={() => setShowForm(false)} style={{flex:1,background:'#fff',color:'#666',border:'0.5px solid #F0D88A',borderRadius:'10px',padding:'10px',fontSize:'13px',cursor:'pointer'}}>Annuler</button>
            </div>
          </div>
        )}

        {objectifs.length === 0 && (
          <div style={{textAlign:'center',padding:'48px 0'}}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" style={{margin:'0 auto 12px',display:'block'}}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            <div style={{fontSize:'14px',color:'#aaa'}}>Aucun objectif pour l'instant</div>
            <div style={{fontSize:'12px',color:'#ccc',marginTop:'4px'}}>Lancez une cagnotte pour un projet commun</div>
          </div>
        )}

        {objectifs.map(o => {
          const contribsObjectif = contributions.filter(c => c.objectif_id === o.id)
          const total = contribsObjectif.reduce((s, c) => s + parseFloat(c.montant), 0)
          const pct = Math.min(100, (total / parseFloat(o.montant_cible)) * 100)
          const parPersonne: Record<string, number> = {}
          contribsObjectif.forEach(c => { parPersonne[c.user_id] = (parPersonne[c.user_id] || 0) + parseFloat(c.montant) })

          return (
            <div key={o.id} style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'16px',marginBottom:'12px',boxShadow:'0 4px 24px rgba(43,127,255,0.06)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                <div style={{fontSize:'15px',fontWeight:'500',color:'#1a1a2e'}}>{o.titre}</div>
                {pct >= 100 && <span style={{fontSize:'11px',background:'#E1F5EE',color:'#10B981',fontWeight:'500',padding:'3px 8px',borderRadius:'99px'}}>Atteint 🎉</span>}
              </div>
              {o.date_limite && (
                <div style={{fontSize:'11px',color:'#aaa',marginBottom:'10px'}}>Avant le {new Date(o.date_limite).toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}</div>
              )}

              <div style={{background:'#F0F4FA',borderRadius:'99px',height:'10px',overflow:'hidden',marginBottom:'8px'}}>
                <div style={{width:`${pct}%`,height:'100%',background:'linear-gradient(90deg,#D4A843,#F97316)',borderRadius:'99px',transition:'width 0.3s ease'}}></div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
                <span style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{total.toFixed(0)} CHF</span>
                <span style={{fontSize:'12px',color:'#aaa'}}>sur {parseFloat(o.montant_cible).toFixed(0)} CHF</span>
              </div>

              {Object.keys(parPersonne).length > 0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'12px'}}>
                  {Object.entries(parPersonne).map(([uid, montant]) => (
                    <span key={uid} style={{fontSize:'11px',background:'#FDF3DC',color:'#8a6d1a',padding:'4px 10px',borderRadius:'99px'}}>
                      {profils[uid]?.nom || 'Membre'} · {montant.toFixed(0)} CHF
                    </span>
                  ))}
                </div>
              )}

              {contribuerA === o.id ? (
                <div style={{display:'flex',gap:'8px'}}>
                  <input value={montantContrib} onChange={e => setMontantContrib(e.target.value)} type="number" min="0" step="5" autoFocus placeholder="Montant CHF"
                    style={{flex:1,border:'1px solid #F0D88A',borderRadius:'10px',padding:'8px 12px',fontSize:'16px',color:'#1a1a2e',boxSizing:'border-box'}}/>
                  <button onClick={() => ajouterContribution(o.id)} style={{background:'#D4A843',color:'#fff',border:'none',borderRadius:'10px',padding:'8px 16px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>OK</button>
                  <button onClick={() => { setContribuerA(null); setMontantContrib("") }} style={{background:'#fff',color:'#aaa',border:'0.5px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',cursor:'pointer'}}>✕</button>
                </div>
              ) : (
                <button onClick={() => setContribuerA(o.id)}
                  style={{width:'100%',background:'#FDF3DC',color:'#8a6d1a',border:'0.5px solid #F0D88A',borderRadius:'10px',padding:'10px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>
                  + Contribuer
                </button>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}
