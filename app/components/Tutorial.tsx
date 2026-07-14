"use client"
import { useState, useEffect } from "react"

type Step = { titre: string; texte: string; position: 'top-right'|'top-left'|'bottom-left'|'bottom-right'|'center' }

const STEPS: Record<string, Step[]> = {
  finances: [
    { titre: "Ajoute tes revenus", texte: "Clique sur l'onglet Revenus puis sur + Revenu pour ajouter ton salaire et voir ton bilan mensuel.", position: 'top-right' },
    { titre: "Tes depenses", texte: "Dans l'onglet Charges, ajoute tes depenses (loyer, courses...) pour voir ton solde reel.", position: 'top-left' },
    { titre: "Simule ton epargne", texte: "Dans Epargne tu peux simuler tes placements. Dans Fiscalite calcule tes impots suisses 2025.", position: 'bottom-left' },
  ],
  calendrier: [
    { titre: "Ajoute un evenement", texte: "Appuie sur n'importe quel jour dans la grille pour creer un evenement avec heure et duree.", position: 'center' },
    { titre: "Navigue entre semaines", texte: "Utilise les fleches < > en haut pour voir les semaines precedentes et suivantes.", position: 'top-left' },
    { titre: "Points colores", texte: "Les points sous les jours indiquent tes evenements. Fais defiler en bas pour voir la liste complete.", position: 'bottom-left' },
  ],
  groupes: [
    { titre: "Cree un groupe", texte: "Clique sur + en haut a droite pour creer un nouveau groupe avec tes proches.", position: 'top-right' },
    { titre: "Menu Actions", texte: "Dans un groupe, clique sur Menu en haut a droite pour lancer un appel video, jouer ou inviter.", position: 'top-right' },
    { titre: "Modifie tes messages", texte: "Appuie longuement sur un de tes messages pour le modifier ou le supprimer.", position: 'bottom-left' },
  ],
  scanner: [
    { titre: "Scanne un document", texte: "Prends en photo une facture, un releve ou un contrat. Le scanner extrait automatiquement le montant et la date.", position: 'center' },
    { titre: "Transfere les donnees", texte: "Apres l'analyse, choisis d'ajouter le montant en depense, revenu, fiscalite ou calendrier.", position: 'bottom-left' },
  ],
  fiscalite: [
    { titre: "Choisis ton canton", texte: "Va dans l'onglet Situation et selectionne ton canton. Les taux sont bases sur les baremes officiels 2025.", position: 'center' },
    { titre: "Optimise tes deductions", texte: "Dans Deductions, entre ton 3e pilier (7 258 CHF max), frais de transport et primes maladie pour reduire ton impot.", position: 'bottom-left' },
  ],
}

export default function Tutorial({ page }: { page: string }) {
  const [etape, setEtape] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const desactive = localStorage.getItem('tuto_desactive')
    if (desactive) return
    const key = 'tuto_' + page
    const n = parseInt(sessionStorage.getItem(key) || '0')
    if (n < 3) {
      sessionStorage.setItem(key, String(n + 1))
      setTimeout(() => setVisible(true), 800)
    }
  }, [page])

  if (!visible || !STEPS[page]) return null

  const steps = STEPS[page]
  const step = steps[etape]
  const total = steps.length

  const positions: any = {
    'top-right':    { top:'80px', right:'12px' },
    'top-left':     { top:'80px', left:'12px' },
    'bottom-left':  { bottom:'110px', left:'12px' },
    'bottom-right': { bottom:'110px', right:'12px' },
    'center':       { top:'50%', left:'50%', transform:'translate(-50%,-50%)' },
  }

  const fermer = () => setVisible(false)
  const suivant = () => etape < total-1 ? setEtape(etape+1) : fermer()

  return (
    <>
      <div onClick={fermer} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:998}}/>
      <div style={{
        position:'fixed',
        ...positions[step.position],
        background:'#1a3a6e',
        borderRadius:'16px',
        padding:'16px',
        width:'270px',
        zIndex:999,
        boxShadow:'0 8px 30px rgba(0,0,0,0.4)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
          <div style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <span style={{fontSize:'13px',fontWeight:'500',color:'#fff'}}>{step.titre}</span>
        </div>
        <p style={{fontSize:'12px',color:'rgba(255,255,255,0.85)',lineHeight:'1.6',margin:'0 0 12px'}}>{step.texte}</p>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',gap:'3px'}}>
            {steps.map((_,i) => (
              <div key={i} style={{height:'4px',borderRadius:'99px',background: i===etape ? '#fff' : 'rgba(255,255,255,0.3)',width: i===etape ? '16px' : '6px',transition:'all 0.3s'}}></div>
            ))}
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={fermer} style={{background:'rgba(255,255,255,0.15)',color:'#fff',border:'none',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',cursor:'pointer'}}>
              Passer
            </button>
            <button onClick={suivant} style={{background:'#fff',color:'#1a3a6e',border:'none',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:'500',cursor:'pointer'}}>
              {etape < total-1 ? 'Suivant →' : 'Terminer ✓'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
