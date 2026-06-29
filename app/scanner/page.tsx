"use client"
import { useState, useRef } from "react"

export default function Scanner() {
  const [image, setImage] = useState<string | null>(null)
  const [analyse, setAnalyse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [etape, setEtape] = useState<"upload"|"analyse"|"resultat">("upload")
  const fileRef = useRef<HTMLInputElement>(null)

  async function analyserDocument(base64: string) {
    setLoading(true)
    setEtape("analyse")
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: base64 }
              },
              {
                type: "text",
                text: `Analyse ce document et extrais les informations importantes. Réponds UNIQUEMENT en JSON valide sans markdown, avec cette structure exacte:
{
  "type": "facture" | "releve_bancaire" | "contrat" | "assurance" | "autre",
  "titre": "nom du document ou de l'entreprise",
  "montant": nombre ou null,
  "date": "date trouvée ou null",
  "description": "résumé en une phrase de ce que c'est",
  "transactions": [{"nom": "...", "montant": nombre, "type": "depense" ou "revenu"}],
  "infos_cles": ["info importante 1", "info importante 2", "info importante 3"]
}`
              }
            ]
          }]
        })
      })
      const data = await response.json()
      const text = data.content[0].text
      const clean = text.replace(/```json|```/g, "").trim()
      const result = JSON.parse(clean)
      setAnalyse(result)
      setEtape("resultat")
    } catch (e) {
      setAnalyse({ type: "autre", titre: "Erreur", description: "Impossible d'analyser ce document.", infos_cles: [], transactions: [] })
      setEtape("resultat")
    }
    setLoading(false)
  }

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64full = e.target?.result as string
      const base64 = base64full.split(",")[1]
      setImage(base64full)
      analyserDocument(base64)
    }
    reader.readAsDataURL(file)
  }

  function reset() {
    setImage(null)
    setAnalyse(null)
    setEtape("upload")
  }

  const typeIcon: any = {
    facture: "🧾",
    releve_bancaire: "🏦",
    contrat: "📋",
    assurance: "🛡️",
    autre: "📄"
  }

  const typeLabel: any = {
    facture: "Facture / Reçu",
    releve_bancaire: "Relevé bancaire",
    contrat: "Contrat",
    assurance: "Assurance",
    autre: "Document"
  }

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 18px 28px'}}>
        <a href="/" style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'8px'}}>← Accueil</a>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginBottom:'4px'}}>Scanner de documents</div>
        <div style={{fontSize:'22px',fontWeight:'500',color:'#fff',marginBottom:'2px'}}>📄 Scan & Analyse</div>
        <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)'}}>L'IA extrait les infos importantes — rien n'est stocké</div>
      </div>

      <div style={{padding:'20px 18px'}}>

        {etape === "upload" && (
          <div>
            <div
              onClick={() => fileRef.current?.click()}
              style={{border:'2px dashed #DCE9FF',borderRadius:'20px',padding:'48px 20px',textAlign:'center',cursor:'pointer',background:'#F8FBFF',marginBottom:'16px'}}>
              <div style={{fontSize:'48px',marginBottom:'12px'}}>📷</div>
              <div style={{fontSize:'15px',fontWeight:'500',color:'#1a1a2e',marginBottom:'6px'}}>Prendre une photo ou choisir un fichier</div>
              <div style={{fontSize:'13px',color:'#aaa',marginBottom:'16px'}}>Facture, relevé bancaire, contrat, assurance...</div>
              <button style={{background:'#2B7FFF',color:'#fff',fontSize:'13px',fontWeight:'500',padding:'10px 24px',borderRadius:'99px',border:'none',cursor:'pointer'}}>
                Choisir un document
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:'none'}}
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}/>
            </div>

            <div style={{background:'#EEF5FF',borderRadius:'14px',padding:'14px',border:'0.5px solid #DCE9FF'}}>
              <div style={{fontSize:'12px',fontWeight:'500',color:'#2B7FFF',marginBottom:'8px'}}>Ce que l'IA peut détecter :</div>
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {["🧾 Factures — montant, date, fournisseur","🏦 Relevés — toutes les transactions","🛡️ Assurances — montant mensuel, couverture","📋 Contrats — informations clés, dates importantes"].map((t,i) => (
                  <div key={i} style={{fontSize:'13px',color:'#666'}}>{t}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {etape === "analyse" && (
          <div style={{textAlign:'center',padding:'48px 0'}}>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>🔍</div>
            <div style={{fontSize:'16px',fontWeight:'500',color:'#1a1a2e',marginBottom:'8px'}}>Analyse en cours...</div>
            <div style={{fontSize:'13px',color:'#aaa',marginBottom:'24px'}}>L'IA lit ton document et extrait les informations</div>
            <div style={{display:'flex',justifyContent:'center',gap:'6px'}}>
              {[0,1,2].map(i => (
                <div key={i} style={{width:'8px',height:'8px',borderRadius:'50%',background:'#2B7FFF',animation:`pulse 1s ${i*0.2}s infinite`}}></div>
              ))}
            </div>
          </div>
        )}

        {etape === "resultat" && analyse && (
          <div>
            {image && (
              <div style={{marginBottom:'16px',borderRadius:'14px',overflow:'hidden',border:'0.5px solid #E8F1FF',maxHeight:'200px',display:'flex',alignItems:'center',justifyContent:'center',background:'#F8FBFF'}}>
                <img src={image} style={{width:'100%',objectFit:'cover',maxHeight:'200px'}} alt="document"/>
              </div>
            )}

            <div style={{background:'linear-gradient(135deg,#EEF5FF,#DCE9FF)',borderRadius:'16px',padding:'16px',marginBottom:'14px',border:'0.5px solid #DCE9FF'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
                <span style={{fontSize:'32px'}}>{typeIcon[analyse.type] || '📄'}</span>
                <div>
                  <div style={{fontSize:'15px',fontWeight:'500',color:'#1a1a2e'}}>{analyse.titre}</div>
                  <div style={{fontSize:'12px',color:'#2B7FFF'}}>{typeLabel[analyse.type] || 'Document'}</div>
                </div>
              </div>
              {analyse.description && (
                <div style={{fontSize:'13px',color:'#666',lineHeight:'1.6',marginBottom:'10px'}}>{analyse.description}</div>
              )}
              {analyse.montant && (
                <div style={{background:'#fff',borderRadius:'10px',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'13px',color:'#666'}}>Montant détecté</span>
                  <span style={{fontSize:'18px',fontWeight:'500',color:'#F43F5E'}}>{analyse.montant} CHF</span>
                </div>
              )}
              {analyse.date && (
                <div style={{fontSize:'12px',color:'#aaa',marginTop:'8px'}}>📅 {analyse.date}</div>
              )}
            </div>

            {analyse.infos_cles?.length > 0 && (
              <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px',marginBottom:'14px'}}>
                <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>Informations clés</div>
                {analyse.infos_cles.map((info: string, i: number) => (
                  <div key={i} style={{display:'flex',gap:'8px',marginBottom:'8px',alignItems:'flex-start'}}>
                    <div style={{width:'20px',height:'20px',borderRadius:'50%',background:'#EEF5FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#2B7FFF',flexShrink:0,marginTop:'1px'}}>✓</div>
                    <div style={{fontSize:'13px',color:'#666',lineHeight:'1.5'}}>{info}</div>
                  </div>
                ))}
              </div>
            )}

            {analyse.transactions?.length > 0 && (
              <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px',marginBottom:'14px'}}>
                <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>Transactions détectées</div>
                {analyse.transactions.map((t: any, i: number) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom: i < analyse.transactions.length-1 ? '0.5px solid #E8F1FF' : 'none'}}>
                    <span style={{fontSize:'13px',color:'#666'}}>{t.nom}</span>
                    <span style={{fontSize:'13px',fontWeight:'500',color: t.type === 'revenu' ? '#10B981' : '#F43F5E'}}>
                      {t.type === 'revenu' ? '+' : '-'}{t.montant} CHF
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={reset}
                style={{flex:1,background:'#F0F8FF',color:'#2B7FFF',fontSize:'13px',fontWeight:'500',padding:'12px',borderRadius:'12px',border:'0.5px solid #DCE9FF',cursor:'pointer'}}>
                📷 Nouveau scan
              </button>
              <a href="/finances" style={{flex:1}}>
                <button style={{width:'100%',background:'#2B7FFF',color:'#fff',fontSize:'13px',fontWeight:'500',padding:'12px',borderRadius:'12px',border:'none',cursor:'pointer'}}>
                  💸 Aller aux finances
                </button>
              </a>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </main>
  )
}
