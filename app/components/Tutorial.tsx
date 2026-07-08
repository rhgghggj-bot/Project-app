"use client"
import { useState, useEffect } from "react"

const TUTORIELS: any = {
  finances: [
    { titre: "Commence ici !", texte: "Ajoute d'abord ton salaire en cliquant sur + Revenu pour voir ton bilan mensuel.", cible: "top-right" },
    { titre: "Tes depenses", texte: "Ensuite ajoute tes charges (loyer, courses...) dans Charges pour voir ton solde reel.", cible: "top-left" },
    { titre: "Simule ton epargne", texte: "Dans Epargne tu peux simuler tes placements et voir combien tu auras dans 10 ans.", cible: "bottom-left" },
  ],
  calendrier: [
    { titre: "Ajoute un evenement", texte: "Appuie sur n'importe quel jour pour ajouter un evenement avec heure et duree.", cible: "top-right" },
    { titre: "Navigue entre semaines", texte: "Utilise les fleches < > pour voir les semaines precedentes et suivantes.", cible: "top-left" },
    { titre: "Points colores", texte: "Les points sous les jours indiquent le nombre d'evenements. Plusieurs couleurs = plusieurs evenements.", cible: "bottom-left" },
  ],
  groupes: [
    { titre: "Cree ou rejoins", texte: "Cree un groupe avec tes proches ou rejoins-en un avec un lien d'invitation.", cible: "top-right" },
    { titre: "Menu Actions", texte: "Dans un groupe, clique sur Menu en haut a droite pour lancer un appel, jouer ou inviter.", cible: "top-left" },
    { titre: "Modifie tes messages", texte: "Appuie sur un de tes messages pour le modifier ou le supprimer.", cible: "bottom-left" },
  ],
  scanner: [
    { titre: "Scanne un document", texte: "Prends en photo une facture, un releve ou un contrat pour l'analyser automatiquement.", cible: "top-right" },
    { titre: "Transfère les donnees", texte: "Apres l'analyse, choisis d'ajouter le montant en depense, revenu ou dans la fiscalite.", cible: "bottom-left" },
  ],
  fiscalite: [
    { titre: "Ton canton", texte: "Va dans Situation et choisis ton canton. Les taux sont bases sur les baremes officiels 2025.", cible: "top-right" },
    { titre: "Optimise tes deductions", texte: "Dans Deductions, entre ton 3e pilier, frais de transport et primes maladie pour reduire ton impot.", cible: "bottom-left" },
  ],
}

export default function Tutorial({ page }: { page: string }) {
  const [etape, setEtape] = useState(0)
  const [visible, setVisible] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const key = 'tuto_' + page
    const n = parseInt(sessionStorage.getItem(key) || '0')
    setCount(n)
    if (n < 3) {
      sessionStorage.setItem(key, String(n + 1))
      setTimeout(() => setVisible(true), 800)
    }
  }, [page])

  if (!visible || !TUTORIELS[page]) return null

  const steps = TUTORIELS[page]
  const step = steps[etape]
  const total = steps.length

  const pos: any = {
    'top-right': { top:'12px', right:'12px' },
    'top-left': { top:'12px', left:'12px' },
    'bottom-left': { bottom:'100px', left:'12px' },
    'bottom-right': { bottom:'100px', right:'12px' },
  }

  return (
    <>
      <div onClick={() => setVisible(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:998}}></div>
      <div style={{
        position:'fixed',
        ...pos[step.cible],
        background:'#1a3a6e',
        borderRadius:'16px',
        padding:'16px',
        maxWidth:'280px',
        zIndex:999,
        boxShadow:'0 8px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
          <div style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <span style={{fontSize:'13px',fontWeight:'500',color:'#fff'}}>{step.titre}</span>
        </div>
        <p style={{fontSize:'12px',color:'rgba(255,255,255,0.8)',lineHeight:'1.6',margin:'0 0 12px'}}>{step.texte}</p>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:'11px',color:'rgba(255,255,255,0.5)'}}>{etape+1} / {total}</span>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={() => setVisible(false)}
              style={{background:'rgba(255,255,255,0.15)',color:'#fff',border:'none',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',cursor:'pointer'}}>
              Passer
            </button>
            {etape < total - 1 ? (
              <button onClick={() => setEtape(etape+1)}
                style={{background:'#fff',color:'#1a3a6e',border:'none',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:'500',cursor:'pointer'}}>
                Suivant →
              </button>
            ) : (
              <button onClick={() => setVisible(false)}
                style={{background:'#fff',color:'#1a3a6e',border:'none',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:'500',cursor:'pointer'}}>
                Terminer ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
