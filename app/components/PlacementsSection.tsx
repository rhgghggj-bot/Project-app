"use client"
import { useState } from "react"

const PLACEMENTS = [
  {
    id: 'livretA', nom: 'Livret A', pays: 'FR', rendement: 2.4,
    plafond: '22 950 EUR', fiscalite: 'Totalement exonere', risque: 'Aucun', horizon: '0 a 5 ans', couleur: '#10B981',
    description: "Le livret A est le placement garanti par l'Etat francais. Taux abaisse a 2.4% depuis fevrier 2025 (contre 3% en 2024). Ideal pour l'epargne de precaution : gardez 3 a 6 mois de charges fixes dessus avant d'investir ailleurs.",
    avantages: [
      "Interets 100% exoneres d'impot sur le revenu et de prelevements sociaux",
      "Capital garanti par l'Etat francais sans limite",
      "Retrait possible a tout moment, sans frais ni penalite",
      "Ouverture gratuite dans toute banque ou La Poste",
      "Accessible a tous, meme aux mineurs"
    ],
    inconvenients: [
      "Taux de 2.4% en 2025 — inferieur a l'inflation certaines annees",
      "Plafond strict de 22 950 EUR (hors interets capitalises)",
      "Un seul livret A par personne en France",
      "Ne convient pas pour faire fructifier un capital important"
    ]
  },
  {
    id: 'pea', nom: 'PEA', pays: 'FR', rendement: 7,
    plafond: '150 000 EUR', fiscalite: '17.2% apres 5 ans', risque: 'Moyen-eleve', horizon: '5 ans minimum', couleur: '#2B7FFF',
    description: "Le Plan d'Epargne en Actions est l'enveloppe fiscale la plus avantageuse pour investir en bourse en France. Apres 5 ans, seuls les 17.2% de prelevements sociaux s'appliquent sur les plus-values — pas d'impot sur le revenu. Parfait pour investir dans des ETF europeens ou mondiaux sur le long terme.",
    avantages: [
      "Exoneration d'impot sur le revenu apres 5 ans (seuls 17.2% de PS restent)",
      "Plafond de 150 000 EUR — largement suffisant pour la plupart",
      "Accessible aux ETF MSCI World, S&P 500 eligibles PEA",
      "Cloture possible apres 5 ans sans perdre les avantages fiscaux",
      "Transmissible au conjoint en cas de deces"
    ],
    inconvenients: [
      "Tout retrait avant 5 ans entraine la cloture du PEA",
      "Limite aux actions et fonds bases dans l'Union Europeenne",
      "Capital non garanti — risque de perte en capital",
      "Un seul PEA par contribuable"
    ]
  },
  {
    id: 'av', nom: 'Assurance-vie', pays: 'FR', rendement: 4.5,
    plafond: 'Illimite', fiscalite: '7.5% + 17.2% apres 8 ans', risque: 'Faible a eleve', horizon: '8 ans minimum', couleur: '#8B5CF6',
    description: "L'assurance-vie est le placement prefere des Francais (1 900 milliards EUR). Elle combine un fonds euros securise (rendement ~2.5% en 2025) et des unites de compte dynamiques. Son avantage successoral est unique : 152 500 EUR transmis hors succession par beneficiaire.",
    avantages: [
      "Abattement fiscal de 4 600 EUR/an sur les gains apres 8 ans (9 200 EUR pour un couple)",
      "Transmission hors succession jusqu'a 152 500 EUR par beneficiaire designe",
      "Pas de plafond de versement — ideal pour les grandes fortunes",
      "Mixte securise (fonds euros) + dynamique (UC actions, immobilier)",
      "Fonds euros garanti par l'assureur"
    ],
    inconvenients: [
      "Frais de gestion annuels : 0.5% a 1.5% selon les contrats",
      "Fonds euros en baisse structurelle (2.5% en 2025 vs 5% en 2000)",
      "Avantages fiscaux maximaux seulement apres 8 ans",
      "Moins liquide qu'un livret en cas de retrait urgent"
    ]
  },
  {
    id: 'etf', nom: 'ETF / Index', pays: 'FR/CH', rendement: 9,
    plafond: 'Illimite', fiscalite: '30% PFU (ou PEA)', risque: 'Moyen-eleve', horizon: '10 ans+', couleur: '#D4A843',
    description: "Les ETF (Exchange Traded Funds) sont des fonds indiciels qui repliquent passivement un indice boursier. Le MSCI World couvre 1 500 entreprises dans 23 pays. Historiquement, le S&P 500 a rapporte +10.5%/an sur 50 ans. C'est la strategie de Warren Buffett pour le grand public.",
    avantages: [
      "Frais de gestion ultra-faibles : 0.07% a 0.5%/an (vs 1.5%+ pour les fonds actifs)",
      "Diversification immediate sur des centaines ou milliers d'entreprises",
      "Performance historique superieure a 80% des fonds geres activement",
      "Accessible des 1 EUR via certains courtiers (Trade Republic, Degiro)",
      "Combine parfaitement avec le PEA pour optimiser la fiscalite"
    ],
    inconvenients: [
      "Capital non garanti — peut perdre 30 a 50% en periode de crise",
      "Fiscalite de 30% hors PEA sur les plus-values",
      "Necessite une vision long terme et de ne pas paniquer en cas de baisse",
      "Aucun rendement garanti — performance basee sur les marches"
    ]
  },
  {
    id: 'pilier2', nom: '2e pilier', pays: 'CH', rendement: 1.25,
    plafond: 'Selon salaire LPP', fiscalite: 'Cotisations deductibles', risque: 'Tres faible', horizon: 'Retraite (65 ans)', couleur: '#F43F5E',
    description: "Le 2e pilier (LPP - Loi sur la Prevoyance Professionnelle) est obligatoire pour tous les salaries en Suisse gagnant plus de 22 680 CHF/an. Taux minimum legal 2025 : 1.25%. Vous pouvez verser des rachats volontaires entierement deductibles de votre revenu imposable.",
    avantages: [
      "Cotisations et rachats entierement deductibles du revenu imposable",
      "Votre employeur verse au minimum le meme montant que vous",
      "Capital garanti par la LPP et le fonds de garantie",
      "Rachats volontaires : forte reduction d'impots immediate",
      "Possible de retirer pour achat immobilier ou depart a l'etranger"
    ],
    inconvenients: [
      "Capital bloque jusqu'a 65 ans (homme) / 64 ans (femme) sauf cas specifiques",
      "Taux minimum legal faible : 1.25% en 2025",
      "Imposition a la sortie (taux reduit mais non nul)",
      "Performance dependante de la sante financiere de votre caisse de pension",
      "Rente viagere : si vous mourez tot, le capital ne revient pas a vos heritiers"
    ]
  },
  {
    id: 'pilier3', nom: '3e pilier', pays: 'CH', rendement: 3,
    plafond: '7 258 CHF/an (2025)', fiscalite: 'Deductible impots', risque: 'Faible a eleve', horizon: '5 a 40 ans', couleur: '#EC4899',
    description: "Le pilier 3a est la prevoyance individuelle liee en Suisse. Plafond 2025 : 7 258 CHF pour les salaries, 36 288 CHF pour les independants. Chaque franc verse reduit votre revenu imposable — l'economie fiscale varie de 500 a 3 000 CHF/an selon votre canton et tranche d'imposition.",
    avantages: [
      "Deduction fiscale immediate : economie de 500 a 3 000 CHF/an selon canton et revenu",
      "Plafond 2025 : 7 258 CHF (salaries) ou 36 288 CHF (independants)",
      "Pilier 3a en titres : investissement en actions/ETF avec avantage fiscal",
      "Possible d'ouvrir plusieurs comptes 3a (strategie de fractionnement a la retraite)",
      "Retraite anticipee possible 5 ans avant l'age ordinaire"
    ],
    inconvenients: [
      "Capital totalement bloque jusqu'a 5 ans avant la retraite",
      "Imposition a la sortie (taux separe reduit, mais impot quand meme)",
      "Plafond annuel limite a 7 258 CHF pour les salaries",
      "Pas de flexibilite : impossible de retirer pour une urgence ordinaire"
    ]
  }
]


const ETF_INDICES = [
  {
    id: 'sp500',
    nom: 'S&P 500',
    description: 'Les 500 plus grandes entreprises américaines (Apple, Microsoft, Amazon, Google...)',
    rendement: 10.5,
    duree: '50 ans',
    valeur1000: 142000,
    volatilite: 'Élevée',
    horizon: '10 ans+',
    couleur: '#10B981',
    courbe: [0,2,4,6,9,13,18,22,28,35,42,50,60,72,88,108,130,142],
    annees: ['1975','1980','1985','1990','1995','2000','2005','2010','2015','2020','2025'],
    etfs: [
      { nom: 'iShares Core S&P 500', ticker: 'CSPX', ter: '0.07%', pays: 'CH', courtiers: ['Swissquote','Interactive Brokers','Neon Invest'] },
      { nom: 'Amundi S&P 500 UCITS ETF', ticker: 'PE500', ter: '0.15%', pays: 'FR', courtiers: ['Boursorama','Trade Republic','Fortuneo'] },
    ],
    risques: ['Volatilité élevée — baisses de 30-50% possibles', 'Risque de change USD/CHF ou USD/EUR'],
    avantages: ['Frais ultra-faibles 0.07%/an', 'Diversification 500 entreprises', '+10.5%/an sur 50 ans en moyenne']
  },
  {
    id: 'msci',
    nom: 'MSCI World',
    description: '1 600 entreprises dans 23 pays développés — la diversification mondiale par excellence',
    rendement: 9.2,
    duree: '50 ans',
    valeur1000: 78000,
    volatilite: 'Moyenne-élevée',
    horizon: '10 ans+',
    couleur: '#2B7FFF',
    courbe: [0,1.8,3.5,5.5,8,12,17,21,27,33,40,48,57,65,76,78],
    annees: ['1975','1980','1985','1990','1995','2000','2005','2010','2015','2020','2025'],
    etfs: [
      { nom: 'iShares MSCI World', ticker: 'SWRD', ter: '0.20%', pays: 'CH', courtiers: ['Swissquote','Interactive Brokers'] },
      { nom: 'Amundi MSCI World', ticker: 'CW8', ter: '0.38%', pays: 'FR', courtiers: ['Boursorama','Fortuneo','Trade Republic'] },
    ],
    risques: ['Concentré à 65% sur les USA', 'Capital non garanti'],
    avantages: ['Diversification mondiale maximale', 'Moins volatile que S&P 500 seul', 'Idéal pour un premier ETF']
  },
  {
    id: 'smi',
    nom: 'SMI Suisse',
    description: '20 plus grandes entreprises suisses — Nestlé, Novartis, Roche, UBS, Richemont...',
    rendement: 7.8,
    duree: '30 ans',
    valeur1000: 28000,
    volatilite: 'Moyenne',
    horizon: '5 ans+',
    couleur: '#D4A843',
    courbe: [0,1.5,3,5,8,11,14,17,20,24,28],
    annees: ['1995','2000','2005','2010','2015','2020','2025'],
    etfs: [
      { nom: 'iShares SMI ETF', ticker: 'CSSMI', ter: '0.35%', pays: 'CH', courtiers: ['Swissquote','Postfinance'] },
    ],
    risques: ['Concentré sur 20 entreprises uniquement', 'Moins diversifié que MSCI World'],
    avantages: ['En CHF — pas de risque de change', 'Dividendes élevés des entreprises suisses', 'Accessible depuis la Suisse']
  },
  {
    id: 'nasdaq',
    nom: 'NASDAQ 100',
    description: '100 plus grandes entreprises technologiques américaines — Apple, NVIDIA, Meta, Tesla...',
    rendement: 13.5,
    duree: '40 ans',
    valeur1000: 320000,
    volatilite: 'Très élevée',
    horizon: '15 ans+',
    couleur: '#8B5CF6',
    courbe: [0,1,3,5,9,15,8,12,18,25,35,50,70,100,150,210,280,320],
    annees: ['1985','1990','1995','2000','2005','2010','2015','2020','2025'],
    etfs: [
      { nom: 'iShares NASDAQ 100', ticker: 'CNDX', ter: '0.33%', pays: 'CH', courtiers: ['Swissquote','Interactive Brokers'] },
      { nom: 'Amundi NASDAQ-100', ticker: 'PANX', ter: '0.22%', pays: 'FR', courtiers: ['Trade Republic','Boursorama'] },
    ],
    risques: ['Très volatil — baisse de 80% en 2000-2002', 'Concentré sur la tech américaine'],
    avantages: ['+13.5%/an sur 40 ans', 'Profite de la révolution IA et tech', 'ETF le plus performant sur 20 ans']
  }
]

export default function PlacementsSection() {
  const [actif, setActif] = useState('livretA')
  const [etfActif, setEtfActif] = useState<any>(null)
  const [ongletEpargne, setOngletEpargne] = useState('placements')
  const [capital, setCapital] = useState(5000)
  const [versementMois, setVersementMois] = useState(200)
  const [rendementCustom, setRendementCustom] = useState(7)
  const [duree, setDuree] = useState(10)

  const p = PLACEMENTS.find(pl => pl.id === actif)!
  const rm = rendementCustom / 100 / 12
  const simulData = Array.from({length: duree + 1}, (_, y) => {
    const n = y * 12
    const total = rm > 0
      ? Math.round(capital * Math.pow(1 + rm, n) + versementMois * (Math.pow(1 + rm, n) - 1) / rm)
      : capital + versementMois * n
    const verse = capital + versementMois * n
    return { total, verse, interets: Math.max(0, total - verse) }
  })
  const capitalFinal = simulData[duree].total
  const totalVerse = simulData[duree].verse
  const gainSimul = capitalFinal - totalVerse

  return (
    <div>
      <div style={{display:'flex',gap:'8px',marginBottom:'14px',marginTop:'8px'}}>
        <button onClick={() => setOngletEpargne('placements')}
          style={{flex:1,padding:'8px',borderRadius:'10px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:'500',
            background: ongletEpargne==='placements' ? '#2B7FFF' : '#EEF5FF',
            color: ongletEpargne==='placements' ? '#fff' : '#2B7FFF'}}>
          Placements
        </button>
        <button onClick={() => setOngletEpargne('etf')}
          style={{flex:1,padding:'8px',borderRadius:'10px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:'500',
            background: ongletEpargne==='etf' ? '#2B7FFF' : '#EEF5FF',
            color: ongletEpargne==='etf' ? '#fff' : '#2B7FFF'}}>
          ETF & Indices
        </button>
      </div>

      {ongletEpargne === 'etf' && !etfActif && (
        <div>
          {ETF_INDICES.map(etf => {
            const max = Math.max(...etf.courbe)
            return (
              <div key={etf.id} style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'16px',marginBottom:'12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'6px'}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px'}}>
                      <span style={{fontSize:'16px',fontWeight:'600',color:'#1a1a2e'}}>{etf.nom}</span>
                    </div>
                    <div style={{fontSize:'12px',color:'#aaa',marginBottom:'6px'}}>{etf.description}</div>
                    <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                      {etf.etfs.map((e,i) => (
                        <span key={i} style={{fontSize:'10px',padding:'2px 8px',borderRadius:'99px',background:e.pays==='CH'?'#EEF5FF':'#FDF8EC',color:e.pays==='CH'?'#2B7FFF':'#D4A843',fontWeight:'500'}}>
                          {e.pays==='CH'?'🇨🇭':'🇫🇷'} {e.nom}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:'18px',fontWeight:'700',color:etf.couleur}}>+{etf.rendement}%</div>
                    <div style={{fontSize:'10px',color:'#aaa'}}>moy./an {etf.duree}</div>
                  </div>
                </div>

                <div style={{background:'#F8FBFF',borderRadius:'10px',padding:'10px',marginBottom:'10px'}}>
                  <div style={{fontSize:'10px',color:'#aaa',marginBottom:'6px'}}>1 000 CHF investi → {etf.valeur1000.toLocaleString('fr-FR')} CHF aujourd'hui</div>
                  <svg width="100%" height="60" viewBox={"0 0 " + (etf.courbe.length * 20) + " 60"} preserveAspectRatio="none">
                    <polyline
                      points={etf.courbe.map((v,i) => (i * 20) + "," + (58 - (v/max)*54)).join(' ')}
                      fill="none" stroke={etf.couleur} strokeWidth="2" strokeLinejoin="round"/>
                    <polygon
                      points={etf.courbe.map((v,i) => (i * 20) + "," + (58 - (v/max)*54)).join(' ') + " " + ((etf.courbe.length-1)*20) + ",60 0,60"}
                      fill={etf.couleur} opacity="0.1"/>
                  </svg>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'9px',color:'#aaa',marginTop:'4px'}}>
                    {etf.annees.map((a,i) => <span key={i}>{a}</span>)}
                  </div>
                </div>

                <button onClick={() => setEtfActif(etf)}
                  style={{width:'100%',background:'#EEF5FF',color:'#2B7FFF',border:'none',borderRadius:'10px',padding:'10px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>
                  Voir la fiche complète →
                </button>
              </div>
            )
          })}
        </div>
      )}

      {ongletEpargne === 'etf' && etfActif && (
        <div>
          <button onClick={() => setEtfActif(null)} style={{fontSize:'12px',color:'#2B7FFF',background:'none',border:'none',cursor:'pointer',marginBottom:'12px',padding:'0'}}>← Retour aux indices</button>
          
          <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',borderRadius:'16px',padding:'16px',marginBottom:'12px'}}>
            <div style={{fontSize:'18px',fontWeight:'700',color:'#fff',marginBottom:'4px'}}>{etfActif.nom}</div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.6)',marginBottom:'12px'}}>{etfActif.description}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
              <div style={{background:'rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px',textAlign:'center'}}>
                <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',marginBottom:'2px'}}>Rendement {etfActif.duree}</div>
                <div style={{fontSize:'16px',fontWeight:'700',color:'#10B981'}}>+{etfActif.rendement}%/an</div>
              </div>
              <div style={{background:'rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px',textAlign:'center'}}>
                <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',marginBottom:'2px'}}>1 000 CHF → </div>
                <div style={{fontSize:'14px',fontWeight:'700',color:'#fff'}}>{(etfActif.valeur1000/1000).toFixed(0)}k CHF</div>
              </div>
              <div style={{background:'rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px',textAlign:'center'}}>
                <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',marginBottom:'2px'}}>Volatilité</div>
                <div style={{fontSize:'13px',fontWeight:'700',color:'#D4A843'}}>{etfActif.volatilite}</div>
              </div>
            </div>
          </div>

          <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'14px',padding:'14px',marginBottom:'10px'}}>
            <div style={{fontSize:'11px',color:'#2B7FFF',fontWeight:'600',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'8px'}}>C'est quoi ?</div>
            <div style={{fontSize:'13px',color:'#444',lineHeight:'1.7',marginBottom:'10px'}}>
              Un ETF (fonds indiciel coté) qui réplique passivement l'indice {etfActif.nom}. En achetant 1 part tu investis automatiquement dans toutes les entreprises de l'indice.
            </div>
            <div style={{background:'#EEF5FF',borderRadius:'10px',padding:'10px'}}>
              <div style={{fontSize:'12px',color:'#2B7FFF',fontWeight:'500',marginBottom:'4px'}}>Exemple concret</div>
              <div style={{fontSize:'12px',color:'#444',lineHeight:'1.6'}}>
                1 000 CHF investi il y a {etfActif.duree} = <b style={{color:etfActif.couleur}}>{etfActif.valeur1000.toLocaleString('fr-FR')} CHF</b> aujourd'hui.
                <span style={{color:'#aaa'}}> Cet exemple est indicatif — ton montant sera différent.</span>
              </div>
            </div>
          </div>

          {etfActif.etfs.map((e: any, i: number) => (
            <div key={i} style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'14px',padding:'14px',marginBottom:'10px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                <span style={{fontSize:'18px'}}>{e.pays==='CH'?'🇨🇭':'🇫🇷'}</span>
                <div>
                  <div style={{fontSize:'13px',fontWeight:'600',color:'#1a1a2e'}}>{e.nom}</div>
                  <div style={{fontSize:'11px',color:'#aaa'}}>Ticker: {e.ticker} · Frais: {e.ter}/an</div>
                </div>
              </div>
              <div style={{fontSize:'11px',color:'#666',marginBottom:'6px'}}>Courtiers recommandés :</div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                {e.courtiers.map((c: string, j: number) => (
                  <span key={j} style={{fontSize:'11px',padding:'3px 10px',borderRadius:'99px',background:e.pays==='CH'?'#EEF5FF':'#FDF8EC',color:e.pays==='CH'?'#2B7FFF':'#D4A843',fontWeight:'500',border:e.pays==='CH'?'0.5px solid #DCE9FF':'0.5px solid #F0D88A'}}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}

          <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'14px',padding:'14px',marginBottom:'14px'}}>
            <div style={{fontSize:'11px',color:'#10B981',fontWeight:'600',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'8px'}}>Points forts</div>
            {etfActif.avantages.map((a: string,i: number) => (
              <div key={i} style={{display:'flex',gap:'8px',marginBottom:'6px',alignItems:'flex-start'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" style={{flexShrink:0,marginTop:'2px'}}><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{fontSize:'12px',color:'#444',lineHeight:'1.5'}}>{a}</span>
              </div>
            ))}
            <div style={{fontSize:'11px',color:'#F43F5E',fontWeight:'600',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'8px',marginTop:'12px'}}>Points de vigilance</div>
            {etfActif.risques.map((r: string,i: number) => (
              <div key={i} style={{display:'flex',gap:'8px',marginBottom:'6px',alignItems:'flex-start'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2.5" style={{flexShrink:0,marginTop:'2px'}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span style={{fontSize:'12px',color:'#444',lineHeight:'1.5'}}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ongletEpargne === 'placements' && (
        <div><div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'8px',marginBottom:'14px'}}>
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

          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
            <label style={{fontSize:'11px',color:'#666',minWidth:'110px'}}>Capital initial</label>
            <input type="range" min="0" max="100000" step="500" value={capital} onChange={e => setCapital(Number(e.target.value))} style={{flex:1}}/>
            <span style={{fontSize:'11px',fontWeight:'500',minWidth:'70px',textAlign:'right',color:p.couleur}}>{capital.toLocaleString('fr-FR')} CHF</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
            <label style={{fontSize:'11px',color:'#666',minWidth:'110px'}}>Versement/mois</label>
            <input type="range" min="0" max="5000" step="50" value={versementMois} onChange={e => setVersementMois(Number(e.target.value))} style={{flex:1}}/>
            <span style={{fontSize:'11px',fontWeight:'500',minWidth:'70px',textAlign:'right',color:p.couleur}}>{versementMois.toLocaleString('fr-FR')} CHF</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
            <label style={{fontSize:'11px',color:'#666',minWidth:'110px'}}>Rendement/an</label>
            <input type="range" min="0.5" max="15" step="0.5" value={rendementCustom} onChange={e => setRendementCustom(Number(e.target.value))} style={{flex:1}}/>
            <span style={{fontSize:'11px',fontWeight:'500',minWidth:'70px',textAlign:'right',color:p.couleur}}>{rendementCustom}%</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}>
            <label style={{fontSize:'11px',color:'#666',minWidth:'110px'}}>Duree</label>
            <input type="range" min="1" max="30" step="1" value={duree} onChange={e => setDuree(Number(e.target.value))} style={{flex:1}}/>
            <span style={{fontSize:'11px',fontWeight:'500',minWidth:'70px',textAlign:'right',color:p.couleur}}>{duree} an{duree>1?'s':''}</span>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'12px'}}>
            <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px'}}>
              <div style={{fontSize:'10px',color:'#aaa',marginBottom:'2px'}}>Capital final</div>
              <div style={{fontSize:'14px',fontWeight:'500',color:p.couleur}}>{capitalFinal.toLocaleString('fr-FR')} CHF</div>
            </div>
            <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px'}}>
              <div style={{fontSize:'10px',color:'#aaa',marginBottom:'2px'}}>Total verse</div>
              <div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e'}}>{totalVerse.toLocaleString('fr-FR')} CHF</div>
            </div>
            <div style={{background:'#E1F5EE',border:'0.5px solid #A7F3D0',borderRadius:'10px',padding:'10px 12px'}}>
              <div style={{fontSize:'10px',color:'#10B981',marginBottom:'2px'}}>Gain (interets)</div>
              <div style={{fontSize:'14px',fontWeight:'500',color:'#10B981'}}>+{gainSimul.toLocaleString('fr-FR')} CHF</div>
            </div>
            <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px'}}>
              <div style={{fontSize:'10px',color:'#aaa',marginBottom:'2px'}}>Rendement reel</div>
              <div style={{fontSize:'14px',fontWeight:'500',color:'#2B7FFF'}}>+{totalVerse > 0 ? Math.round((gainSimul/totalVerse)*100) : 0}%</div>
            </div>
          </div>

          <div style={{display:'flex',alignItems:'flex-end',gap:'2px',height:'80px',marginBottom:'4px'}}>
            {simulData.map((pt, i) => (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'stretch',justifyContent:'flex-end',height:'100%'}}>
                <div style={{width:'100%',height: Math.max((pt.interets / Math.max(...simulData.map(d=>d.total))) * 76, 0) + 'px',background:p.couleur,borderRadius:'2px 2px 0 0'}}></div>
                <div style={{width:'100%',height: Math.max((pt.verse / Math.max(...simulData.map(d=>d.total))) * 76, 2) + 'px',background:p.couleur + '44'}}></div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
            <span style={{fontSize:'10px',color:'#aaa'}}>Maintenant</span>
            <span style={{fontSize:'10px',color:'#aaa'}}>Dans {duree} an{duree>1?'s':''}</span>
          </div>
          <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'10px',color:'#aaa'}}>
              <div style={{width:'10px',height:'10px',borderRadius:'2px',background:p.couleur}}></div>Interets
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'10px',color:'#aaa'}}>
              <div style={{width:'10px',height:'10px',borderRadius:'2px',background:p.couleur+'44'}}></div>Verse
            </div>
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  )
}
