'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const N = 14
const RADIUS_CENTRALE = 5
const RADIUS_SERVICE = 4
const RADIUS_POLLUTION = 3
const RADIUS_PARC = 2

type TypeTuile = 'vide'|'route'|'residentiel'|'commercial'|'industriel'|'parc'|'police'|'ecole'|'centrale'
interface Tuile { type: TypeTuile; niveau: number }

const OUTILS: {id:TypeTuile|'demolir', nom:string, cout:number, couleur:string, icone:string}[] = [
  { id:'route', nom:'Route', cout:10, couleur:'#6B7280', icone:'🛣️' },
  { id:'residentiel', nom:'Résidentiel', cout:50, couleur:'#10B981', icone:'🏠' },
  { id:'commercial', nom:'Commercial', cout:75, couleur:'#2B7FFF', icone:'🏬' },
  { id:'industriel', nom:'Industriel', cout:75, couleur:'#F97316', icone:'🏭' },
  { id:'parc', nom:'Parc', cout:30, couleur:'#22C55E', icone:'🌳' },
  { id:'police', nom:'Police', cout:300, couleur:'#3B82F6', icone:'🚓' },
  { id:'ecole', nom:'École', cout:400, couleur:'#A855F7', icone:'🏫' },
  { id:'centrale', nom:'Centrale', cout:800, couleur:'#EAB308', icone:'⚡' },
  { id:'demolir', nom:'Démolir', cout:0, couleur:'#F43F5E', icone:'🧨' },
]

const MAINTENANCE: any = { route:1, police:15, ecole:20, centrale:25, parc:2 }
const SAVE_KEY = 'simcity_save_v1'

function grilleVide(): Tuile[][] {
  return Array(N).fill(null).map(() => Array(N).fill(null).map(() => ({type:'vide' as TypeTuile, niveau:0})))
}

function vibrer(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}

function distance(r1:number,c1:number,r2:number,c2:number) {
  return Math.sqrt((r1-r2)**2 + (c1-c2)**2)
}

function aRouteAdjacente(g: Tuile[][], r:number, c:number) {
  const voisins = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]
  return voisins.some(([vr,vc]) => vr>=0 && vr<N && vc>=0 && vc<N && g[vr][vc].type === 'route')
}

function dansRayon(g: Tuile[][], r:number, c:number, type: TypeTuile, rayon:number) {
  for (let dr=-rayon; dr<=rayon; dr++) for (let dc=-rayon; dc<=rayon; dc++) {
    const nr=r+dr, nc=c+dc
    if (nr<0||nr>=N||nc<0||nc>=N) continue
    if (distance(r,c,nr,nc) <= rayon && g[nr][nc].type === type) return true
  }
  return false
}

function nbDansRayon(g: Tuile[][], r:number, c:number, type: TypeTuile, rayon:number) {
  let n = 0
  for (let dr=-rayon; dr<=rayon; dr++) for (let dc=-rayon; dc<=rayon; dc++) {
    const nr=r+dr, nc=c+dc
    if (nr<0||nr>=N||nc<0||nc>=N) continue
    if (distance(r,c,nr,nc) <= rayon && g[nr][nc].type === type) n++
  }
  return n
}

const POP_PAR_NIVEAU = [0, 15, 35, 65]
const JOBS_PAR_NIVEAU = [0, 10, 25, 45]

export default function SimCityLite() {
  const router = useRouter()
  const [pret, setPret] = useState(false)
  const [grilleAff, setGrilleAff] = useState<Tuile[][]>(() => grilleVide())
  const [argent, setArgent] = useState(20000)
  const [jour, setJour] = useState(1)
  const [mois, setMois] = useState(1)
  const [population, setPopulation] = useState(0)
  const [bonheur, setBonheur] = useState(60)
  const [demandes, setDemandes] = useState({ r:50, c:30, i:30 })
  const [tauxTaxe, setTauxTaxe] = useState(0.12)
  const [outil, setOutil] = useState<TypeTuile|'demolir'|null>(null)
  const [vitesse, setVitesse] = useState(1)
  const [toast, setToast] = useState<string|null>(null)
  const [meilleurePop, setMeilleurePop] = useState(0)
  const [tremble, setTremble] = useState(false)

  const etatRef = useRef({ grille: grilleVide(), argent: 20000, jour: 1, mois: 1, tauxTaxe: 0.12 })

  useEffect(() => {
    const mp = localStorage.getItem('simcity_meilleure_population')
    if (mp) setMeilleurePop(parseInt(mp))
    const save = localStorage.getItem(SAVE_KEY)
    if (save) {
      try {
        const data = JSON.parse(save)
        etatRef.current = { grille: data.grille, argent: data.argent, jour: data.jour, mois: data.mois, tauxTaxe: data.tauxTaxe }
        setGrilleAff(data.grille)
        setArgent(data.argent)
        setJour(data.jour)
        setMois(data.mois)
        setTauxTaxe(data.tauxTaxe)
      } catch {}
    }
    setPret(true)
  }, [])

  function sauvegarder() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(etatRef.current))
  }

  function afficherToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  function tick() {
    const g = etatRef.current.grille.map(row => row.map(t => ({...t})))
    let pop = 0, jobsC = 0, jobsI = 0
    for (let r=0;r<N;r++) for (let c=0;c<N;c++) {
      const t = g[r][c]
      if (t.type === 'residentiel') pop += POP_PAR_NIVEAU[t.niveau]
      if (t.type === 'commercial') jobsC += JOBS_PAR_NIVEAU[t.niveau]
      if (t.type === 'industriel') jobsI += JOBS_PAR_NIVEAU[t.niveau]
    }
    const emplois = jobsC + jobsI
    const demandR = Math.max(5, Math.min(100, 50 + (emplois - pop) * 0.6))
    const demandC = Math.max(5, Math.min(100, 40 + (pop - jobsC*2) * 0.5))
    const demandI = Math.max(5, Math.min(100, 35 + (pop*0.6 - jobsI) * 0.4))

    let couvertureService = 0, totalRC = 0

    for (let r=0;r<N;r++) for (let c=0;c<N;c++) {
      const t = g[r][c]
      if (t.type !== 'residentiel' && t.type !== 'commercial' && t.type !== 'industriel') continue
      const alimentee = dansRayon(g, r, c, 'centrale', RADIUS_CENTRALE)
      const surRoute = aRouteAdjacente(g, r, c)
      if (t.type === 'residentiel' || t.type === 'commercial') {
        totalRC++
        if (dansRayon(g, r, c, 'police', RADIUS_SERVICE) || dansRayon(g, r, c, 'ecole', RADIUS_SERVICE)) couvertureService++
      }
      if (!alimentee || !surRoute) continue

      const demandeType = t.type === 'residentiel' ? demandR : t.type === 'commercial' ? demandC : demandI
      const pollutionProche = nbDansRayon(g, r, c, 'industriel', RADIUS_POLLUTION)
      const parcProche = dansRayon(g, r, c, 'parc', RADIUS_PARC)
      const serviceProche = dansRayon(g, r, c, 'police', RADIUS_SERVICE) || dansRayon(g, r, c, 'ecole', RADIUS_SERVICE)

      let chanceCroissance = (demandeType/100) * 0.22
      if (t.type === 'residentiel') {
        chanceCroissance -= pollutionProche * 0.03
        if (parcProche) chanceCroissance += 0.05
        if (serviceProche) chanceCroissance += 0.05
      }
      chanceCroissance = Math.max(0, chanceCroissance)

      if (t.niveau < 3 && Math.random() < chanceCroissance) t.niveau += 1
      else if (t.niveau > 0 && pollutionProche >= 3 && Math.random() < 0.04) t.niveau -= 1
    }

    const couverturePct = totalRC > 0 ? (couvertureService/totalRC) : 1
    const bonheurCalc = Math.max(5, Math.min(100, Math.round(
      55 + couverturePct*20 - tauxTaxe*100*0.6
    )))

    const revenu = Math.round(pop * tauxTaxe * 2.2 + jobsC * 0.9 + jobsI * 0.7)
    let depense = 0
    for (let r=0;r<N;r++) for (let c=0;c<N;c++) {
      const m = MAINTENANCE[g[r][c].type]
      if (m) depense += m
    }
    const net = revenu - depense
    const nouvelArgent = etatRef.current.argent + net
    const nouveauJour = etatRef.current.jour + 1
    let nouveauMois = etatRef.current.mois
    if (nouveauJour % 30 === 1 && nouveauJour > 1) {
      nouveauMois += 1
      afficherToast('Mois ' + nouveauMois + ' — Population ' + pop + ' — Solde ' + (net>=0?'+':'') + net + ' CHF/j')
    }

    etatRef.current = { grille: g, argent: nouvelArgent, jour: nouveauJour, mois: nouveauMois, tauxTaxe: etatRef.current.tauxTaxe }
    setGrilleAff(g)
    setArgent(nouvelArgent)
    setJour(nouveauJour)
    setMois(nouveauMois)
    setPopulation(pop)
    setBonheur(bonheurCalc)
    setDemandes({ r: Math.round(demandR), c: Math.round(demandC), i: Math.round(demandI) })

    if (pop > meilleurePop) {
      setMeilleurePop(pop)
      localStorage.setItem('simcity_meilleure_population', String(pop))
    }
    sauvegarder()
  }

  useEffect(() => {
    if (!pret || vitesse === 0) return
    const delai = vitesse === 1 ? 2200 : 700
    const id = setInterval(tick, delai)
    return () => clearInterval(id)
  }, [pret, vitesse, tauxTaxe])

  function poserTuile(r:number, c:number) {
    if (!outil) return
    const g = etatRef.current.grille
    const t = g[r][c]

    if (outil === 'demolir') {
      if (t.type === 'vide') return
      g[r][c] = { type:'vide', niveau:0 }
      vibrer(15)
    } else {
      if (t.type !== 'vide') { setTremble(true); setTimeout(()=>setTremble(false),300); return }
      const def = OUTILS.find(o => o.id === outil)!
      if (etatRef.current.argent < def.cout) { setTremble(true); setTimeout(()=>setTremble(false),300); vibrer([40,20,40]); return }
      etatRef.current.argent -= def.cout
      g[r][c] = { type: outil, niveau: 0 }
      vibrer(8)
    }
    setGrilleAff(g.map(row => row.map(x => ({...x}))))
    setArgent(etatRef.current.argent)
    sauvegarder()
  }

  function ajusterTaxe(delta: number) {
    const nouveau = Math.max(0.02, Math.min(0.30, Math.round((tauxTaxe + delta) * 100) / 100))
    setTauxTaxe(nouveau)
    etatRef.current.tauxTaxe = nouveau
    sauvegarder()
  }

  function nouvelleVille() {
    if (!confirm('Recommencer une nouvelle ville ? Ta ville actuelle sera perdue.')) return
    const g = grilleVide()
    etatRef.current = { grille: g, argent: 20000, jour: 1, mois: 1, tauxTaxe: 0.12 }
    setGrilleAff(g); setArgent(20000); setJour(1); setMois(1); setTauxTaxe(0.12)
    setPopulation(0); setBonheur(60); setDemandes({r:50,c:30,i:30})
    localStorage.removeItem(SAVE_KEY)
  }

  function couleurTuile(t: Tuile) {
    if (t.type === 'vide') return 'rgba(255,255,255,0.04)'
    if (t.type === 'route') return '#4B5563'
    if (t.type === 'parc') return '#22C55E'
    if (t.type === 'police') return '#3B82F6'
    if (t.type === 'ecole') return '#A855F7'
    if (t.type === 'centrale') return '#EAB308'
    const base = t.type === 'residentiel' ? [16,185,129] : t.type === 'commercial' ? [43,127,255] : [249,115,22]
    const intensite = 0.35 + t.niveau * 0.22
    return `rgba(${base[0]},${base[1]},${base[2]},${intensite})`
  }

  const visage = bonheur >= 75 ? '😄' : bonheur >= 55 ? '🙂' : bonheur >= 35 ? '😐' : '😞'

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(160deg,#0A1628,#132a1f)',padding:'16px 12px',display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',maxWidth:'420px',marginBottom:'10px'}}>
        <button onClick={() => router.push('/jeux')} style={{color:'rgba(255,255,255,0.6)',background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
        <span style={{color:'#fff',fontWeight:'500',fontSize:'15px'}}>Ma Ville</span>
        <button onClick={nouvelleVille} style={{color:'rgba(255,255,255,0.5)',background:'none',border:'none',fontSize:'11px',cursor:'pointer'}}>Nouvelle ville</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'6px',width:'100%',maxWidth:'420px',marginBottom:'8px'}}>
        <div style={{background:'rgba(255,255,255,0.08)',borderRadius:'12px',padding:'8px',textAlign:'center'}}>
          <div style={{fontSize:'9px',color:'rgba(255,255,255,0.5)',textTransform:'uppercase'}}>Argent</div>
          <div style={{fontSize:'13px',fontWeight:'700',color: argent<0 ? '#F43F5E' : '#fff'}}>{argent.toLocaleString('fr-CH')}</div>
        </div>
        <div style={{background:'rgba(255,255,255,0.08)',borderRadius:'12px',padding:'8px',textAlign:'center'}}>
          <div style={{fontSize:'9px',color:'rgba(255,255,255,0.5)',textTransform:'uppercase'}}>Population</div>
          <div style={{fontSize:'13px',fontWeight:'700',color:'#fff'}}>{population}</div>
        </div>
        <div style={{background:'rgba(255,255,255,0.08)',borderRadius:'12px',padding:'8px',textAlign:'center'}}>
          <div style={{fontSize:'9px',color:'rgba(255,255,255,0.5)',textTransform:'uppercase'}}>Jour</div>
          <div style={{fontSize:'13px',fontWeight:'700',color:'#fff'}}>{jour} (M{mois})</div>
        </div>
        <div style={{background:'rgba(255,255,255,0.08)',borderRadius:'12px',padding:'8px',textAlign:'center'}}>
          <div style={{fontSize:'9px',color:'rgba(255,255,255,0.5)',textTransform:'uppercase'}}>Bonheur</div>
          <div style={{fontSize:'13px',fontWeight:'700',color:'#fff'}}>{visage} {bonheur}%</div>
        </div>
      </div>

      <div style={{display:'flex',gap:'6px',width:'100%',maxWidth:'420px',marginBottom:'8px'}}>
        {[{l:'R',v:demandes.r,c:'#10B981'},{l:'C',v:demandes.c,c:'#2B7FFF'},{l:'I',v:demandes.i,c:'#F97316'}].map(d => (
          <div key={d.l} style={{flex:1,background:'rgba(255,255,255,0.06)',borderRadius:'8px',padding:'6px 8px'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'9px',color:'rgba(255,255,255,0.5)',marginBottom:'3px'}}>
              <span>{d.l}</span><span>{d.v}%</span>
            </div>
            <div style={{height:'4px',background:'rgba(255,255,255,0.1)',borderRadius:'99px',overflow:'hidden'}}>
              <div style={{width:d.v+'%',height:'100%',background:d.c,borderRadius:'99px'}}></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',maxWidth:'420px',marginBottom:'10px',background:'rgba(255,255,255,0.06)',borderRadius:'10px',padding:'6px 10px'}}>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.6)'}}>Taux d'imposition : <b style={{color:'#fff'}}>{Math.round(tauxTaxe*100)}%</b></div>
        <div style={{display:'flex',gap:'6px'}}>
          <button onClick={() => ajusterTaxe(-0.01)} style={{width:'24px',height:'24px',borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',cursor:'pointer'}}>−</button>
          <button onClick={() => ajusterTaxe(0.01)} style={{width:'24px',height:'24px',borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',cursor:'pointer'}}>+</button>
        </div>
        <div style={{display:'flex',gap:'4px'}}>
          <button onClick={() => setVitesse(0)} style={{background: vitesse===0?'#2B7FFF':'rgba(255,255,255,0.1)',border:'none',borderRadius:'6px',color:'#fff',fontSize:'12px',padding:'4px 8px',cursor:'pointer'}}>⏸</button>
          <button onClick={() => setVitesse(1)} style={{background: vitesse===1?'#2B7FFF':'rgba(255,255,255,0.1)',border:'none',borderRadius:'6px',color:'#fff',fontSize:'12px',padding:'4px 8px',cursor:'pointer'}}>▶</button>
          <button onClick={() => setVitesse(2)} style={{background: vitesse===2?'#2B7FFF':'rgba(255,255,255,0.1)',border:'none',borderRadius:'6px',color:'#fff',fontSize:'12px',padding:'4px 8px',cursor:'pointer'}}>⏩</button>
        </div>
      </div>

      <div style={{display:'flex',gap:'6px',width:'100%',maxWidth:'420px',overflowX:'auto',paddingBottom:'8px',marginBottom:'8px'}}>
        {OUTILS.map(o => (
          <button key={o.id} onClick={() => setOutil(outil === o.id ? null : o.id)}
            style={{flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',background: outil===o.id ? 'rgba(43,127,255,0.3)' : 'rgba(255,255,255,0.06)',border: outil===o.id ? '1px solid #2B7FFF' : '1px solid transparent',borderRadius:'12px',padding:'8px 10px',cursor:'pointer',minWidth:'58px'}}>
            <span style={{fontSize:'18px'}}>{o.icone}</span>
            <span style={{fontSize:'9px',color:'#fff',fontWeight:'500'}}>{o.nom}</span>
            {o.cout > 0 && <span style={{fontSize:'8px',color:'rgba(255,255,255,0.5)'}}>{o.cout}</span>}
          </button>
        ))}
      </div>

      <div style={{position:'relative',width:'100%',maxWidth:'420px'}}>
        {toast && (
          <div style={{position:'absolute',top:'-4px',left:'50%',transform:'translate(-50%,-100%)',zIndex:20,background:'linear-gradient(135deg,#D4A843,#F97316)',color:'#fff',padding:'8px 16px',borderRadius:'12px',fontSize:'12px',fontWeight:'600',boxShadow:'0 8px 20px rgba(212,168,67,0.4)',whiteSpace:'nowrap'}}>
            {toast}
          </div>
        )}
        <div style={{
          display:'grid',gridTemplateColumns:`repeat(${N}, 1fr)`,gap:'1.5px',
          background:'rgba(255,255,255,0.03)',borderRadius:'12px',padding:'6px',
          animation: tremble ? 'shakeCity 0.3s' : 'none'
        }}>
          {grilleAff.map((row, r) => row.map((t, c) => (
            <div key={r+'-'+c} onClick={() => poserTuile(r,c)}
              style={{
                aspectRatio:'1', background: couleurTuile(t), borderRadius:'2px', cursor: outil ? 'pointer':'default',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:'8px',
                opacity: (t.type==='residentiel'||t.type==='commercial'||t.type==='industriel') && t.niveau===0 ? 0.45 : 1,
                border: (t.type==='residentiel'||t.type==='commercial'||t.type==='industriel') && t.niveau===0 ? '1px dashed rgba(255,255,255,0.3)' : 'none'
              }}>
              {t.type==='parc' && '🌳'}
              {t.type==='police' && '🚓'}
              {t.type==='ecole' && '🏫'}
              {t.type==='centrale' && '⚡'}
            </div>
          )))}
        </div>
      </div>

      <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',textAlign:'center',marginTop:'10px',maxWidth:'380px'}}>
        Zone ta ville avec des routes, puis du résidentiel/commercial/industriel connectés. Construis une centrale (⚡) pour les alimenter. Record de population : <b style={{color:'#D4A843'}}>{meilleurePop}</b>
      </div>

      <style>{`
        @keyframes shakeCity {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </main>
  )
}
