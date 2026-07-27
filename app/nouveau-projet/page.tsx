"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function NouveauProjet() {
  const [titre, setTitre] = useState("")
  const [description, setDescription] = useState("")
  const [categorie, setCategorie] = useState("")
  const [revolut, setRevolut] = useState("")
  const [wave, setWave] = useState("")
  const [objectif, setObjectif] = useState("")
  const [echeance, setEcheance] = useState("")
  const [groupeId, setGroupeId] = useState("")
  const [prive, setPrive] = useState(false)
  const [groupes, setGroupes] = useState<any[]>([])
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: membres } = await supabase
          .from("membres_groupe")
          .select("groupe_id, groupes(id, nom)")
          .eq("user_id", user.id)
        setGroupes(membres?.map((m: any) => m.groupes) || [])
      }
    }
    charger()
  }, [])

  async function publier() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = "/connexion"; return }
    const { error } = await supabase.from("projets").insert({
      user_id: user.id, titre, description, categorie,
      image_url: revolut, groupe_id: groupeId || null, prive
    })
    if (error) { setMessage("Erreur : " + error.message) }
    else { setMessage("Projet publié !"); setTimeout(() => window.location.href = "/profile", 1500) }
  }

  const cats = ["Tech","Restauration","Commerce","Musique","Art","Sport","Education","Autre"]

  return (
    <main style={{minHeight:'100vh',background:'#f8faff'}}>
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',padding:'20px 18px 32px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-40px',right:'-40px',width:'160px',height:'160px',borderRadius:'50%',background:'rgba(255,255,255,0.06)'}}></div>
        <a href="/profile" style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'12px',textDecoration:'none'}}>← Retour</a>
        <div style={{fontSize:'22px',fontWeight:'600',color:'#fff',marginBottom:'4px'}}>Lance ton projet</div>
        <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)'}}>Partage ton ambition avec la communauté</div>
      </div>

      <div style={{padding:'16px 14px',marginTop:'-16px'}}>

        <div style={{background:'#fff',borderRadius:'16px',padding:'16px',marginBottom:'12px',boxShadow:'0 2px 8px rgba(43,127,255,0.06)',border:'0.5px solid #E8F1FF'}}>
          <div style={{fontSize:'11px',color:'#2B7FFF',fontWeight:'600',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'8px'}}>Nom du projet</div>
          <input type="text" placeholder="Ex: Restaurant le Coin, App fitness..." value={titre} onChange={e => setTitre(e.target.value)}
            style={{width:'100%',border:'none',fontSize:'16px',color:'#1a1a2e',outline:'none',background:'transparent',boxSizing:'border-box'}}/>
        </div>

        <div style={{background:'#fff',borderRadius:'16px',padding:'16px',marginBottom:'12px',boxShadow:'0 2px 8px rgba(43,127,255,0.06)',border:'0.5px solid #E8F1FF'}}>
          <div style={{fontSize:'11px',color:'#2B7FFF',fontWeight:'600',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'8px'}}>Description</div>
          <textarea placeholder="Décris ton projet, tes objectifs, pourquoi tu as besoin de soutien..." value={description} onChange={e => setDescription(e.target.value)}
            style={{width:'100%',border:'none',fontSize:'14px',color:'#1a1a2e',outline:'none',background:'transparent',resize:'none',height:'80px',boxSizing:'border-box',lineHeight:'1.6'}}/>
        </div>

        <div style={{fontSize:'12px',color:'#aaa',fontWeight:'500',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'.05em'}}>Catégorie</div>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'16px'}}>
          {cats.map(c => (
            <button key={c} onClick={() => setCategorie(c)}
              style={{padding:'8px 14px',borderRadius:'99px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:'500',
                background: categorie === c ? '#2B7FFF' : '#EEF5FF',
                color: categorie === c ? '#fff' : '#2B7FFF'}}>
              {c}
            </button>
          ))}
        </div>

        <div style={{display:'flex',gap:'10px',marginBottom:'12px'}}>
          <div style={{flex:1,background:'#fff',borderRadius:'16px',padding:'14px',boxShadow:'0 2px 8px rgba(43,127,255,0.06)',border:'0.5px solid #E8F1FF'}}>
            <div style={{fontSize:'11px',color:'#D4A843',fontWeight:'600',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'6px'}}>Cagnotte</div>
            <div style={{display:'flex',alignItems:'baseline',gap:'4px'}}>
              <input placeholder="500" type="number" value={objectif} onChange={e => setObjectif(e.target.value)}
                style={{width:'100%',border:'none',fontSize:'20px',fontWeight:'600',color:'#1a1a2e',outline:'none',background:'transparent'}}/>
              <span style={{fontSize:'13px',color:'#aaa'}}>CHF</span>
            </div>
          </div>
          <div style={{flex:1,background:'#fff',borderRadius:'16px',padding:'14px',boxShadow:'0 2px 8px rgba(43,127,255,0.06)',border:'0.5px solid #E8F1FF'}}>
            <div style={{fontSize:'11px',color:'#10B981',fontWeight:'600',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'6px'}}>Date limite</div>
            <input type="date" value={echeance} onChange={e => setEcheance(e.target.value)}
              style={{width:'100%',border:'none',fontSize:'13px',color:'#1a1a2e',outline:'none',background:'transparent'}}/>
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:'16px',padding:'14px',marginBottom:'8px',boxShadow:'0 2px 8px rgba(43,127,255,0.06)',border:'0.5px solid #E8F1FF'}}>
          <div style={{fontSize:'11px',color:'#666',fontWeight:'600',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'6px'}}>Lien Revolut</div>
          <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
            <span style={{fontSize:'13px',color:'#aaa'}}>revolut.me/</span>
            <input type="text" placeholder="tonpseudo" value={revolut} onChange={e => setRevolut(e.target.value)}
              style={{flex:1,border:'none',fontSize:'16px',color:'#1a1a2e',outline:'none',background:'transparent'}}/>
          </div>
        </div>
        <div style={{background:'#fff',borderRadius:'16px',padding:'14px',marginBottom:'12px',boxShadow:'0 2px 8px rgba(43,127,255,0.06)',border:'0.5px solid #E8F1FF'}}>
          <div style={{fontSize:'11px',color:'#10B981',fontWeight:'600',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'6px'}}>Lien Wave</div>
          <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
            <span style={{fontSize:'13px',color:'#aaa'}}>wave.com/</span>
            <input type="text" placeholder="tonpseudo" value={wave} onChange={e => setWave(e.target.value)}
              style={{flex:1,border:'none',fontSize:'16px',color:'#1a1a2e',outline:'none',background:'transparent'}}/>
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:'16px',padding:'14px',marginBottom:'16px',boxShadow:'0 2px 8px rgba(43,127,255,0.06)',border:'0.5px solid #E8F1FF',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{prive ? 'Publication privée' : 'Publication publique'}</div>
            <div style={{fontSize:'11px',color:'#aaa',marginTop:'2px'}}>{prive ? 'Visible uniquement par toi' : 'Visible par toute la communauté'}</div>
          </div>
          <button onClick={() => setPrive(!prive)}
            style={{width:'44px',height:'24px',borderRadius:'99px',border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',background: prive ? '#2B7FFF' : '#E2E8F0'}}>
            <div style={{width:'20px',height:'20px',borderRadius:'50%',background:'#fff',position:'absolute',top:'2px',transition:'left 0.2s',left: prive ? '22px' : '2px',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}></div>
          </button>
        </div>

        {!prive && groupes.length > 0 && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'14px',marginBottom:'16px',border:'0.5px solid #E8F1FF'}}>
            <div style={{fontSize:'11px',color:'#666',marginBottom:'8px'}}>Partager dans un groupe (optionnel)</div>
            <select value={groupeId} onChange={e => setGroupeId(e.target.value)}
              style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'14px',color:'#1a1a2e',background:'#F8FBFF'}}>
              <option value="">Visible par tous (public)</option>
              {groupes.map((g: any) => <option key={g.id} value={g.id}>{g.nom}</option>)}
            </select>
          </div>
        )}

        <button onClick={publier}
          style={{width:'100%',background:'linear-gradient(135deg,#1a3a6e,#2B7FFF)',color:'#fff',border:'none',borderRadius:'16px',padding:'16px',fontSize:'15px',fontWeight:'600',cursor:'pointer'}}>
          {prive ? 'Publier en privé' : 'Publier mon projet'}
        </button>

        {message && <p style={{fontSize:'14px',textAlign:'center',color:'#10B981',fontWeight:'500',marginTop:'12px'}}>{message}</p>}
      </div>
    </main>
  )
}
