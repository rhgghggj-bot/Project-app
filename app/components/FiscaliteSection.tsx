"use client"
import { useState } from "react"

const CANTONS: any = {
  GE:{nom:'Geneve',t:[{m:20000,r:.053},{m:40000,r:.072},{m:60000,r:.091},{m:80000,r:.107},{m:100000,r:.114},{m:150000,r:.120},{m:1e9,r:.130}],ef:13000,em:8000},
  VD:{nom:'Vaud',t:[{m:20000,r:.048},{m:40000,r:.068},{m:60000,r:.088},{m:80000,r:.105},{m:100000,r:.118},{m:150000,r:.128},{m:1e9,r:.138}],ef:9000,em:6700},
  VS:{nom:'Valais',t:[{m:20000,r:.038},{m:40000,r:.055},{m:60000,r:.072},{m:80000,r:.085},{m:100000,r:.095},{m:150000,r:.105},{m:1e9,r:.115}],ef:8500,em:6000},
  FR:{nom:'Fribourg',t:[{m:20000,r:.042},{m:40000,r:.060},{m:60000,r:.078},{m:80000,r:.092},{m:100000,r:.103},{m:150000,r:.112},{m:1e9,r:.122}],ef:8000,em:6000},
  NE:{nom:'Neuchatel',t:[{m:20000,r:.050},{m:40000,r:.072},{m:60000,r:.093},{m:80000,r:.110},{m:100000,r:.122},{m:150000,r:.132},{m:1e9,r:.140}],ef:8500,em:6700},
  JU:{nom:'Jura',t:[{m:20000,r:.045},{m:40000,r:.065},{m:60000,r:.084},{m:80000,r:.099},{m:100000,r:.110},{m:150000,r:.120},{m:1e9,r:.130}],ef:8000,em:6000}
}

const IFD_C = [{m:14500,r:0},{m:31600,r:.0077},{m:41400,r:.0088},{m:55200,r:.0264},{m:72500,r:.0297},{m:78100,r:.0550},{m:103600,r:.0649},{m:134600,r:.0880},{m:176000,r:.1100},{m:755200,r:.1320},{m:1e9,r:.115}]
const IFD_M = [{m:28300,r:0},{m:50900,r:.010},{m:58400,r:.020},{m:75300,r:.030},{m:90300,r:.040},{m:103400,r:.050},{m:114700,r:.060},{m:124200,r:.070},{m:131700,r:.080},{m:137300,r:.090},{m:141200,r:.100},{m:145000,r:.105},{m:1e9,r:.115}]

function calcIFD(rev: number, mar: boolean) {
  const b = mar ? IFD_M : IFD_C
  let t = 0, p = 0
  for (const s of b) { if (rev <= p) break; t += (Math.min(rev, s.m) - p) * s.r; p = s.m }
  return Math.round(t)
}

function calcCant(rev: number, code: string) {
  const tr = CANTONS[code].t
  for (const s of tr) { if (rev <= s.m) return Math.round(rev * s.r) }
  return Math.round(rev * tr[tr.length-1].r)
}

const inp: any = {width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'16px',color:'#1a1a2e',background:'#F8FBFF',boxSizing:'border-box'}
const sel: any = {width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'16px',color:'#1a1a2e',background:'#F8FBFF'}

export default function FiscaliteSection() {
  const [onglet, setOnglet] = useState('revenus')
  const [salaire, setSalaire] = useState(80000)
  const [accessoires, setAccessoires] = useState(0)
  const [fortune, setFortune] = useState(0)
  const [pilier3, setPilier3] = useState(7258)
  const [pilier2, setPilier2] = useState(0)
  const [transport, setTransport] = useState(2400)
  const [repas, setRepas] = useState(1600)
  const [formation, setFormation] = useState(0)
  const [hypo, setHypo] = useState(0)
  const [maladie, setMaladie] = useState(3500)
  const [dons, setDons] = useState(0)
  const [garde, setGarde] = useState(0)
  const [canton, setCanton] = useState('GE')
  const [situation, setSituation] = useState('cel')
  const [enfants, setEnfants] = useState(0)

  const c = CANTONS[canton]
  const mar = situation === 'mar'
  const brut = salaire + accessoires + fortune
  const totDed = Math.min(pilier3,7258)+pilier2+Math.min(transport,3200)+Math.min(repas,3200)+Math.min(formation,12700)+hypo+maladie+Math.min(dons,brut*.2)+garde+enfants*c.ef+(situation==='mon'?c.em:0)+Math.round(salaire*.03)
  const imposable = Math.max(0, brut - totDed)
  const ifdV = calcIFD(imposable, mar)
  const cantV = calcCant(imposable, canton)
  const total = ifdV + cantV
  const eco = Math.max(0, calcIFD(brut,mar)+calcCant(brut,canton) - total)
  const taux = brut > 0 ? ((total/brut)*100).toFixed(1) : '0.0'

  return (
    <div>
      <div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e',marginBottom:'12px'}}>Calculateur fiscal 2025</div>
      <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'8px',marginBottom:'14px'}}>
        {['revenus','deductions','situation','resultat'].map(o => (
          <button key={o} onClick={()=>setOnglet(o)}
            style={{whiteSpace:'nowrap',padding:'6px 14px',borderRadius:'99px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:'500',
              background:onglet===o?'#2B7FFF':'#F8FBFF',color:onglet===o?'#fff':'#666'}}>
            {o.charAt(0).toUpperCase()+o.slice(1)}
          </button>
        ))}
      </div>

      {onglet==='revenus' && (
        <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px',marginBottom:'12px'}}>
          <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'12px'}}>Mes revenus</div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Salaire brut annuel (CHF)</label>
          <input type="number" value={salaire} onChange={e=>setSalaire(Number(e.target.value))} style={{...inp,marginBottom:'10px'}}/>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Revenus accessoires (CHF)</label>
          <input type="number" value={accessoires} onChange={e=>setAccessoires(Number(e.target.value))} style={{...inp,marginBottom:'10px'}}/>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Rendements de fortune (CHF)</label>
          <input type="number" value={fortune} onChange={e=>setFortune(Number(e.target.value))} style={inp}/>
        </div>
      )}

      {onglet==='deductions' && (
        <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px',marginBottom:'12px'}}>
          <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'12px'}}>Mes deductions</div>
          <div style={{fontSize:'11px',color:'#2B7FFF',fontWeight:'500',marginBottom:'8px'}}>PREVOYANCE</div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>3e pilier 3a (max 7 258 CHF)</label>
          <input type="number" value={pilier3} onChange={e=>setPilier3(Number(e.target.value))} style={{...inp,marginBottom:'10px'}}/>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Rachat 2e pilier (CHF)</label>
          <input type="number" value={pilier2} onChange={e=>setPilier2(Number(e.target.value))} style={{...inp,marginBottom:'10px'}}/>
          <div style={{fontSize:'11px',color:'#2B7FFF',fontWeight:'500',margin:'4px 0 8px'}}>FRAIS PROFESSIONNELS</div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Transport (max 3 200 CHF)</label>
          <input type="number" value={transport} onChange={e=>setTransport(Number(e.target.value))} style={{...inp,marginBottom:'10px'}}/>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Frais de repas (max 3 200 CHF)</label>
          <input type="number" value={repas} onChange={e=>setRepas(Number(e.target.value))} style={{...inp,marginBottom:'10px'}}/>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Formation (max 12 700 CHF)</label>
          <input type="number" value={formation} onChange={e=>setFormation(Number(e.target.value))} style={{...inp,marginBottom:'10px'}}/>
          <div style={{fontSize:'11px',color:'#2B7FFF',fontWeight:'500',margin:'4px 0 8px'}}>AUTRES DEDUCTIONS</div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Interets hypothecaires (CHF)</label>
          <input type="number" value={hypo} onChange={e=>setHypo(Number(e.target.value))} style={{...inp,marginBottom:'10px'}}/>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Primes maladie deductibles (CHF)</label>
          <input type="number" value={maladie} onChange={e=>setMaladie(Number(e.target.value))} style={{...inp,marginBottom:'10px'}}/>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Dons associations (max 20%)</label>
          <input type="number" value={dons} onChange={e=>setDons(Number(e.target.value))} style={{...inp,marginBottom:'10px'}}/>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Frais garde enfants (CHF)</label>
          <input type="number" value={garde} onChange={e=>setGarde(Number(e.target.value))} style={inp}/>
        </div>
      )}

      {onglet==='situation' && (
        <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px',marginBottom:'12px'}}>
          <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'12px'}}>Ma situation</div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Canton de residence</label>
          <select value={canton} onChange={e=>setCanton(e.target.value)} style={{...sel,marginBottom:'10px'}}>
            {Object.entries(CANTONS).map(([k,v]: any)=><option key={k} value={k}>{v.nom}</option>)}
          </select>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Situation familiale</label>
          <select value={situation} onChange={e=>setSituation(e.target.value)} style={{...sel,marginBottom:'10px'}}>
            <option value="cel">Celibataire</option>
            <option value="mar">Marie(e)</option>
            <option value="mon">Famille monoparentale</option>
          </select>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Nombre enfants</label>
          <select value={enfants} onChange={e=>setEnfants(Number(e.target.value))} style={sel}>
            {[0,1,2,3,4].map(n=><option key={n} value={n}>{n===4?'4+':n}</option>)}
          </select>
        </div>
      )}

      {onglet==='resultat' && (
        <div>
          <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px',marginBottom:'12px'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'12px'}}>Resume fiscal 2025 — {c.nom}</div>
            {[
              {l:'Revenu brut',v:brut.toLocaleString('fr-CH')+' CHF',col:'#1a1a2e'},
              {l:'Total deductions',v:'−'+totDed.toLocaleString('fr-CH')+' CHF',col:'#10B981'},
              {l:'Revenu imposable',v:imposable.toLocaleString('fr-CH')+' CHF',col:'#2B7FFF'},
              {l:'IFD federal',v:ifdV.toLocaleString('fr-CH')+' CHF',col:'#F43F5E'},
              {l:'Impot cantonal',v:cantV.toLocaleString('fr-CH')+' CHF',col:'#F43F5E'},
            ].map((r,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'0.5px solid #E8F1FF'}}>
                <span style={{fontSize:'12px',color:'#666'}}>{r.l}</span>
                <span style={{fontSize:'13px',fontWeight:'500',color:r.col}}>{r.v}</span>
              </div>
            ))}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginTop:'12px'}}>
              <div style={{background:'#FFE4E6',border:'0.5px solid #FECDD3',borderRadius:'10px',padding:'10px 12px'}}>
                <div style={{fontSize:'10px',color:'#F43F5E',marginBottom:'2px'}}>Impot total estime</div>
                <div style={{fontSize:'16px',fontWeight:'500',color:'#F43F5E'}}>{total.toLocaleString('fr-CH')} CHF</div>
              </div>
              <div style={{background:'#E1F5EE',border:'0.5px solid #A7F3D0',borderRadius:'10px',padding:'10px 12px'}}>
                <div style={{fontSize:'10px',color:'#10B981',marginBottom:'2px'}}>Taux effectif</div>
                <div style={{fontSize:'16px',fontWeight:'500',color:'#10B981'}}>{taux}%</div>
              </div>
            </div>
            <div style={{background:'#EEF5FF',border:'0.5px solid #DCE9FF',borderRadius:'12px',padding:'12px',marginTop:'12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'13px',fontWeight:'500',color:'#2B7FFF'}}>Economie deductions</span>
              <span style={{fontSize:'18px',fontWeight:'500',color:'#10B981'}}>+{eco.toLocaleString('fr-CH')} CHF</span>
            </div>
          </div>
          <div style={{background:'#FDF8EC',border:'0.5px solid #F0D88A',borderRadius:'12px',padding:'12px'}}>
            <div style={{fontSize:'12px',fontWeight:'500',color:'#D4A843',marginBottom:'4px'}}>Estimation uniquement</div>
            <div style={{fontSize:'12px',color:'#666',lineHeight:'1.6'}}>Base sur les baremes 2025. Impot communal non inclus. Consultez un fiduciaire pour un calcul exact.</div>
          </div>
        </div>
      )}
    </div>
  )
}
