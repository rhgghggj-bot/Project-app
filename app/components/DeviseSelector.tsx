"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

const DEVISES = [
  { code: 'CHF', nom: 'Franc suisse', flag: '🇨🇭' },
  { code: 'EUR', nom: 'Euro', flag: '🇪🇺' },
  { code: 'USD', nom: 'Dollar américain', flag: '🇺🇸' },
  { code: 'GBP', nom: 'Livre sterling', flag: '🇬🇧' },
  { code: 'CAD', nom: 'Dollar canadien', flag: '🇨🇦' },
  { code: 'JPY', nom: 'Yen japonais', flag: '🇯🇵' },
  { code: 'MAD', nom: 'Dirham marocain', flag: '🇲🇦' },
  { code: 'XOF', nom: 'Franc CFA', flag: '🌍' },
  { code: 'AED', nom: 'Dirham émirati', flag: '🇦🇪' },
  { code: 'BRL', nom: 'Réal brésilien', flag: '🇧🇷' },
]

export default function DeviseSelector({ onClose }: { onClose: () => void }) {
  const [devise, setDevise] = useState('CHF')
  const [taux, setTaux] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Charger la devise actuelle
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase.from('profiles').select('devise').eq('id', user.id).single()
        if (data?.devise) setDevise(data.devise)
      }
    })
    // Charger les taux de change en temps reel
    fetch('https://api.frankfurter.app/latest?from=CHF')
      .then(r => r.json())
      .then(data => setTaux(data.rates))
      .catch(() => {})
  }, [])

  async function sauvegarder() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ devise }).eq('id', user.id)
    }
    localStorage.setItem('nexia_devise', devise)
    setLoading(false)
    onClose()
    window.location.reload()
  }

  const deviseActuelle = DEVISES.find(d => d.code === devise)
  const tauxActuel = taux && devise !== 'CHF' ? taux[devise] : 1

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1500,display:'flex',alignItems:'flex-end'}}>
      <div style={{background:'#f8faff',borderRadius:'20px 20px 0 0',width:'100%',maxHeight:'90vh',overflowY:'auto',padding:'20px 14px 40px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <div style={{fontSize:'18px',fontWeight:'600',color:'#1a1a2e'}}>Ma devise</div>
          <button onClick={onClose} style={{background:'#F8FBFF',border:'0.5px solid #E8F1FF',borderRadius:'50%',width:'32px',height:'32px',cursor:'pointer',fontSize:'16px'}}>×</button>
        </div>

        {taux && devise !== 'CHF' && (
          <div style={{background:'linear-gradient(135deg,#1a3a6e,#2B7FFF)',borderRadius:'14px',padding:'14px',marginBottom:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.6)',marginBottom:'2px'}}>Taux en temps réel</div>
              <div style={{fontSize:'16px',fontWeight:'600',color:'#fff'}}>1 CHF = {tauxActuel?.toFixed(2)} {devise}</div>
            </div>
            <div style={{fontSize:'24px'}}>{deviseActuelle?.flag}</div>
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'16px'}}>
          {DEVISES.map(d => (
            <div key={d.code} onClick={() => setDevise(d.code)}
              style={{borderRadius:'14px',padding:'14px',cursor:'pointer',border: devise===d.code ? '2px solid #2B7FFF' : '0.5px solid #E8F1FF',
                background: devise===d.code ? '#EEF5FF' : '#fff'}}>
              <div style={{fontSize:'22px',marginBottom:'4px'}}>{d.flag}</div>
              <div style={{fontSize:'15px',fontWeight:'600',color: devise===d.code ? '#2B7FFF' : '#1a1a2e'}}>{d.code}</div>
              <div style={{fontSize:'11px',color:'#aaa'}}>{d.nom}</div>
              {taux && d.code !== 'CHF' && taux[d.code] && (
                <div style={{fontSize:'10px',color:'#2B7FFF',marginTop:'4px'}}>1 CHF = {taux[d.code].toFixed(2)}</div>
              )}
            </div>
          ))}
        </div>

        <button onClick={sauvegarder} disabled={loading}
          style={{width:'100%',background:'linear-gradient(135deg,#1a3a6e,#2B7FFF)',color:'#fff',border:'none',borderRadius:'14px',padding:'14px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
          {loading ? 'Sauvegarde...' : 'Confirmer ma devise'}
        </button>
      </div>
    </div>
  )
}
