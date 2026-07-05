"use client"
import { useState } from "react"

const PLACEMENTS = [
  {
    id: 'livretA', nom: 'Livret A', pays: 'FR', rendement: 3,
    plafond: '22 950 EUR', fiscalite: 'Exonere', risque: 'Aucun', horizon: '0 a 5 ans', couleur: '#10B981',
    description: "Le livret A est le placement securise par excellence. Garanti par l'Etat francais, ideal pour l'epargne de precaution.",
    avantages: ["Interets exoneres d'impot et de prelevements sociaux","Capital garanti par l'Etat","Disponible a tout moment sans penalite"],
    inconvenients: ["Rendement limite face a l'inflation","Plafond de 22 950 EUR","Un seul livret A par personne"]
  },
  {
    id: 'pea', nom: 'PEA', pays: 'FR', rendement: 7,
    plafond: '150 000 EUR', fiscalite: '17.2% apres 5 ans', risque: 'Moyen-eleve', horizon: '5 ans minimum', couleur: '#2B7FFF',
    description: "Le Plan d'Epargne en Actions permet d'investir en actions europeennes avec une fiscalite avantageuse apres 5 ans.",
    avantages: ["Exoneration d'impot sur les plus-values apres 5 ans","Plafond eleve de 150 000 EUR","Large choix d'ETF eligibles"],
    inconvenients: ["Tout retrait avant 5 ans cloture le PEA","Limite aux actions europeennes","Capital non garanti"]
  },
  {
    id: 'av', nom: 'Assurance-vie', pays: 'FR', rendement: 4.5,
    plafond: 'Illimite', fiscalite: '7.5% apres 8 ans', risque: 'Faible a eleve', horizon: '8 ans minimum', couleur: '#8B5CF6',
    description: "L'assurance-vie combine securite (fonds euros) et performance (unites de compte). Avantageuse apres 8 ans et pour la succession.",
    avantages: ["Fiscalite avantageuse apres 8 ans (abattement 4 600 EUR/an)","Transmission hors succession jusqu'a 152 500 EUR par beneficiaire","Pas de plafond de versement"],
    inconvenients: ["Frais parfois eleves","Fonds euros en baisse","Optimale seulement apres 8 ans"]
  },
  {
    id: 'etf', nom: 'ETF / Index', pays: 'FR/CH', rendement: 8,
    plafond: 'Illimite', fiscalite: '30% (PFU) ou PEA', risque: 'Moyen-eleve', horizon: '10 ans+', couleur: '#D4A843',
    description: "Les ETF repliquent un indice boursier (S&P 500, MSCI World). Frais tres bas, diversification maximale.",
    avantages: ["Frais de gestion tres faibles (0.05% a 0.5%/an)","Diversification immediate","Performance historique S&P 500 : +10%/an sur 30 ans"],
    inconvenients: ["Capital non garanti","Fiscalite de 30% hors PEA","Necessite une discipline de long terme"]
  },
  {
    id: 'pilier2', nom: '2e pilier', pays: 'CH', rendement: 1.25,
    plafond: 'Selon salaire', fiscalite: 'Deductible AVS', risque: 'Tres faible', horizon: 'Retraite', couleur: '#F43F5E',
    description: "La prevoyance professionnelle obligatoire en Suisse (LPP). Votre employeur et vous cotisez ensemble pour la retraite.",
    avantages: ["Cotisations deductibles du revenu imposable","Employeur verse autant que vous","Capital garanti par la LPP"],
    inconvenients: ["Capital bloque jusqu'a la retraite","Taux minimum legal faible (1.25%)","Depend de la sante de votre caisse"]
  },
  {
    id: 'pilier3', nom: '3e pilier', pays: 'CH', rendement: 3,
    plafond: '7 056 CHF/an', fiscalite: 'Deductible impots', risque: 'Faible a moyen', horizon: '5 a 30 ans', couleur: '#EC4899',
    description: "La prevoyance individuelle liee (pilier 3a) permet d'epargner pour la retraite avec deduction fiscale immediate.",
    avantages: ["Deduction fiscale immediate (500 a 2 000 CHF/an selon canton)","Plafond 2024 : 7 056 CHF pour les salaries","Possible en actions via pilier 3a titres"],
    inconvenients: ["Capital bloque jusqu'a 5 ans avant la retraite","Imposition a la sortie","Plafond annuel limite"]
  }
]

export default function PlacementsSection() {
  const [actif, setActif] = useState('livretA')
  const [capital, setCapital] = useState(5000)
  const [duree, setDuree] = useState(10)

  const p = PLACEMENTS.find(pl => pl.id === actif)!
  const rate = p.rendement / 100
  const max = Math.round(capital * Math.pow(1 + rate, duree))
  const gain = max - capital
  const projections = Array.from({length: duree + 1}, (_, i) => Math.round(capital * Math.pow(1 + rate, i)))
  const step = Math.max(1, Math.floor(duree / 10))
  const displayed = projections.filter((_, i) => i % step === 0 || i === duree)
  const maxVal = displayed[displayed.length - 1]

  return (
    <div>
      <div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e',marginBottom:'12px',marginTop:'8px'}}>Placements</div>

      <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'8px',marginBottom:'14px'}}>
        {PLACEMENTS.map(pl => (
          <button key={pl.id} onClick={() => setActif(pl.id)}
            style={{whiteSpace:'nowrap',padding:'6px 14px',borderRadius:'99px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:'500',
              background: actif === pl.id ? pl.couleur : '#F8FBFF',
              color: actif === pl.id ? '#fff' : '#666'}}>
            {pl.nom}
          </button>
        ))}
      </div>

      <div style={{background:'#fff',border:'1px solid ' + p.couleur + '33',borderRadius:'16px',overflow:'hidden',marginBottom:'12px'}}>
        <div style={{background:p.couleur + '10',padding:'16px',borderBottom:'0.5px solid ' + p.couleur + '22'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
            <div style={{fontSize:'18px',fontWeight:'500',color:'#1a1a2e'}}>{p.nom}</div>
            <span style={{fontSize:'11px',background:p.couleur,color:'#fff',padding:'3px 10px',borderRadius:'99px'}}>{p.pays}</span>
          </div>
          <div style={{fontSize:'12px',color:'#666',lineHeight:'1.5'}}>{p.description}</div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1px',background:'#E8F1FF'}}>
          {[
            {label:'Rendement', val:'~' + p.rendement + '%/an', color:p.couleur},
            {label:'Plafond', val:p.plafond, color:'#1a1a2e'},
            {label:'Fiscalite', val:p.fiscalite, color:'#2B7FFF'},
            {label:'Horizon', val:p.horizon, color:'#1a1a2e'},
          ].map((s,i) => (
            <div key={i} style={{background:'#fff',padding:'12px 14px'}}>
              <div style={{fontSize:'10px',color:'#aaa',marginBottom:'3px'}}>{s.label}</div>
              <div style={{fontSize:'13px',fontWeight:'500',color:s.color}}>{s.val}</div>
            </div>
          ))}
        </div>

        <div style={{padding:'14px',borderTop:'0.5px solid #E8F1FF'}}>
          <div style={{fontSize:'12px',fontWeight:'500',color:'#10B981',marginBottom:'8px'}}>Avantages</div>
          {p.avantages.map((a,i) => (
            <div key={i} style={{display:'flex',gap:'8px',marginBottom:'6px',alignItems:'flex-start'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" style={{flexShrink:0,marginTop:'2px'}}><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{fontSize:'12px',color:'#444',lineHeight:'1.5'}}>{a}</span>
            </div>
          ))}
          <div style={{fontSize:'12px',fontWeight:'500',color:'#F43F5E',marginBottom:'8px',marginTop:'12px'}}>Points de vigilance</div>
          {p.inconvenients.map((a,i) => (
            <div key={i} style={{display:'flex',gap:'8px',marginBottom:'6px',alignItems:'flex-start'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2.5" style={{flexShrink:0,marginTop:'2px'}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              <span style={{fontSize:'12px',color:'#444',lineHeight:'1.5'}}>{a}</span>
            </div>
          ))}
        </div>

        <div style={{padding:'14px',borderTop:'0.5px solid #E8F1FF',background:'#F8FBFF'}}>
          <div style={{fontSize:'12px',fontWeight:'500',color:'#1a1a2e',marginBottom:'12px'}}>Simulateur de capital</div>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
            <label style={{fontSize:'11px',color:'#666',minWidth:'72px'}}>Capital</label>
            <input type="range" min="1000" max="100000" step="1000" value={capital} onChange={e => setCapital(Number(e.target.value))} style={{flex:1}}/>
            <span style={{fontSize:'12px',fontWeight:'500',minWidth:'75px',textAlign:'right',color:p.couleur}}>{capital.toLocaleString('fr-FR')} CHF</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px'}}>
            <label style={{fontSize:'11px',color:'#666',minWidth:'72px'}}>Duree</label>
            <input type="range" min="1" max="30" step="1" value={duree} onChange={e => setDuree(Number(e.target.value))} style={{flex:1}}/>
            <span style={{fontSize:'12px',fontWeight:'500',minWidth:'75px',textAlign:'right',color:p.couleur}}>{duree} an{duree > 1 ? 's' : ''}</span>
          </div>
          <div style={{display:'flex',alignItems:'flex-end',gap:'2px',height:'80px',marginBottom:'8px'}}>
            {displayed.map((val, i) => (
              <div key={i} style={{flex:1,height: Math.max((val / maxVal) * 76, 4) + 'px',borderRadius:'3px 3px 0 0',
                background: i === displayed.length - 1 ? p.couleur : p.couleur + '55',transition:'height 0.3s'}}></div>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
            <span style={{fontSize:'10px',color:'#aaa'}}>Maintenant</span>
            <span style={{fontSize:'10px',color:'#aaa'}}>Dans {duree} an{duree>1?'s':''}</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px'}}>
              <div style={{fontSize:'10px',color:'#aaa',marginBottom:'2px'}}>Capital final</div>
              <div style={{fontSize:'15px',fontWeight:'500',color:p.couleur}}>{max.toLocaleString('fr-FR')} CHF</div>
            </div>
            <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px'}}>
              <div style={{fontSize:'10px',color:'#aaa',marginBottom:'2px'}}>Gain estime</div>
              <div style={{fontSize:'15px',fontWeight:'500',color:'#10B981'}}>+{gain.toLocaleString('fr-FR')} CHF</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
