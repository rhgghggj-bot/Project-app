"use client"
import { useState, useRef, useEffect } from "react"

export default function Scanner() {
  const [image, setImage] = useState<string | null>(null)
  const [texte, setTexte] = useState<string>("")
  const [analyse, setAnalyse] = useState<any>(null)
  const [etape, setEtape] = useState<"upload"|"analyse"|"resultat">("upload")
  const fileRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  async function analyserTexte(txt: string) {
    const lignes = txt.split("\n").map(l => l.trim()).filter(l => l.length > 1)
    
    const montants: number[] = []
    const dates: string[] = []
    const mots: string[] = []

    lignes.forEach(ligne => {
      const montantMatch = ligne.match(/(\d+[\.,]\d{2})\s*(CHF|EUR|€|Fr\.?)?/gi)
      if (montantMatch) {
        montantMatch.forEach(m => {
          const num = parseFloat(m.replace(/[^\d.,]/g, "").replace(",", "."))
          if (num > 0 && num < 100000) montants.push(num)
        })
      }
      const dateMatch = ligne.match(/\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}/)
      if (dateMatch) dates.push(dateMatch[0])
      if (ligne.length > 3 && ligne.length < 60) mots.push(ligne)
    })

    const isAssurance = txt.toLowerCase().includes("assur") || txt.toLowerCase().includes("prime") || txt.toLowerCase().includes("police")
    const isReleve = txt.toLowerCase().includes("solde") || txt.toLowerCase().includes("compte") || txt.toLowerCase().includes("iban") || txt.toLowerCase().includes("relevé")
    const isFacture = txt.toLowerCase().includes("facture") || txt.toLowerCase().includes("total") || txt.toLowerCase().includes("tva") || txt.toLowerCase().includes("invoice")
    const isContrat = txt.toLowerCase().includes("contrat") || txt.toLowerCase().includes("signat") || txt.toLowerCase().includes("parties")

    let type = "autre"
    if (isAssurance) type = "assurance"
    else if (isReleve) type = "releve_bancaire"
    else if (isFacture) type = "facture"
    else if (isContrat) type = "contrat"

    const maxMontant = montants.length > 0 ? Math.max(...montants) : null
    const transactions = montants.slice(0, 5).map((m, i) => ({
      nom: mots[i] || `Transaction ${i+1}`,
      montant: m,
      type: "depense"
    }))

    setAnalyse({
      type,
      titre: mots[0] || "Document scanné",
      montant: maxMontant,
      date: dates[0] || null,
      infos_cles: mots.slice(0, 5),
      transactions: isReleve ? transactions : [],
      texte_complet: lignes.slice(0, 20).join("\n")
    })
    setEtape("resultat")
  }

  async function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const src = e.target?.result as string
      setImage(src)
      setEtape("analyse")

      try {
        const Tesseract = (await import("tesseract.js")).default
        const { data: { text } } = await Tesseract.recognize(src, "fra+eng", {
          logger: () => {}
        })
        setTexte(text)
        analyserTexte(text)
      } catch {
        setAnalyse({
          type: "autre",
          titre: "Document",
          description: "Texte extrait manuellement",
          infos_cles: ["Impossible de lire le texte automatiquement"],
          transactions: []
        })
        setEtape("resultat")
      }
    }
    reader.readAsDataURL(file)
  }

  function reset() {
    setImage(null); setTexte(""); setAnalyse(null); setEtape("upload")
  }

  const typeIcon: any = { facture:"🧾", releve_bancaire:"🏦", contrat:"📋", assurance:"🛡️", autre:"📄" }
  const typeLabel: any = { facture:"Facture / Reçu", releve_bancaire:"Relevé bancaire", contrat:"Contrat", assurance:"Assurance", autre:"Document" }

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 18px 28px'}}>
        <a href="/" style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'8px'}}>← Accueil</a>
        <div style={{fontSize:'22px',fontWeight:'500',color:'#fff',marginBottom:'2px'}}>📄 Scanner</div>
        <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)'}}>Reconnaissance de texte — 100% gratuit</div>
      </div>

      <div style={{padding:'20px 18px'}}>
        {etape === "upload" && (
          <div>
            <div onClick={() => fileRef.current?.click()}
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
              <div style={{fontSize:'12px',fontWeight:'500',color:'#2B7FFF',marginBottom:'8px'}}>Ce que le scanner détecte :</div>
              {["🧾 Factures — montant total, date","🏦 Relevés — transactions et solde","🛡️ Assurances — primes et dates","📋 Contrats — informations clés"].map((t,i) => (
                <div key={i} style={{fontSize:'13px',color:'#666',marginBottom:'4px'}}>{t}</div>
              ))}
              <div style={{fontSize:'11px',color:'#aaa',marginTop:'8px'}}>💡 Pour de meilleurs résultats, prends une photo nette avec bonne lumière</div>
            </div>
          </div>
        )}

        {etape === "analyse" && (
          <div style={{textAlign:'center',padding:'48px 0'}}>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>🔍</div>
            <div style={{fontSize:'16px',fontWeight:'500',color:'#1a1a2e',marginBottom:'8px'}}>Lecture du document...</div>
            <div style={{fontSize:'13px',color:'#aaa',marginBottom:'8px'}}>Extraction du texte en cours</div>
            <div style={{fontSize:'12px',color:'#2B7FFF'}}>Cela peut prendre 10-30 secondes</div>
          </div>
        )}

        {etape === "resultat" && analyse && (
          <div>
            {image && (
              <div style={{marginBottom:'16px',borderRadius:'14px',overflow:'hidden',border:'0.5px solid #E8F1FF',maxHeight:'180px',display:'flex',alignItems:'center',justifyContent:'center',background:'#F8FBFF'}}>
                <img src={image} style={{width:'100%',objectFit:'cover',maxHeight:'180px'}} alt="document"/>
              </div>
            )}

            <div style={{background:'linear-gradient(135deg,#EEF5FF,#DCE9FF)',borderRadius:'16px',padding:'16px',marginBottom:'14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
                <span style={{fontSize:'32px'}}>{typeIcon[analyse.type] || '📄'}</span>
                <div>
                  <div style={{fontSize:'15px',fontWeight:'500',color:'#1a1a2e'}}>{analyse.titre}</div>
                  <div style={{fontSize:'12px',color:'#2B7FFF'}}>{typeLabel[analyse.type] || 'Document'}</div>
                </div>
              </div>
              {analyse.montant && (
                <div style={{background:'#fff',borderRadius:'10px',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <span style={{fontSize:'13px',color:'#666'}}>Montant détecté</span>
                  <span style={{fontSize:'18px',fontWeight:'500',color:'#F43F5E'}}>{analyse.montant} CHF</span>
                </div>
              )}
              {analyse.date && <div style={{fontSize:'12px',color:'#aaa'}}>📅 {analyse.date}</div>}
            </div>

            {analyse.infos_cles?.length > 0 && (
              <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px',marginBottom:'14px'}}>
                <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>Texte extrait</div>
                {analyse.infos_cles.map((info: string, i: number) => (
                  <div key={i} style={{display:'flex',gap:'8px',marginBottom:'6px',alignItems:'flex-start'}}>
                    <div style={{width:'18px',height:'18px',borderRadius:'50%',background:'#EEF5FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',color:'#2B7FFF',flexShrink:0}}>✓</div>
                    <div style={{fontSize:'13px',color:'#666'}}>{info}</div>
                  </div>
                ))}
              </div>
            )}

            {analyse.transactions?.length > 0 && (
              <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px',marginBottom:'14px'}}>
                <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>Montants détectés</div>
                {analyse.transactions.map((t: any, i: number) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom: i < analyse.transactions.length-1 ? '0.5px solid #E8F1FF' : 'none'}}>
                    <span style={{fontSize:'13px',color:'#666'}}>{t.nom}</span>
                    <span style={{fontSize:'13px',fontWeight:'500',color:'#F43F5E'}}>{t.montant} CHF</span>
                  </div>
                ))}
              </div>
            )}

            {texte && (
              <div style={{background:'#F8FBFF',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px',marginBottom:'14px'}}>
                <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'8px'}}>Texte complet extrait</div>
                <div style={{fontSize:'12px',color:'#666',lineHeight:'1.6',whiteSpace:'pre-wrap',maxHeight:'200px',overflow:'auto'}}>{texte.slice(0,500)}{texte.length > 500 ? '...' : ''}</div>
              </div>
            )}

            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={reset}
                style={{flex:1,background:'#F0F8FF',color:'#2B7FFF',fontSize:'13px',fontWeight:'500',padding:'12px',borderRadius:'12px',border:'0.5px solid #DCE9FF',cursor:'pointer'}}>
                📷 Nouveau scan
              </button>
              <a href="/finances" style={{flex:1,textDecoration:'none'}}>
                <button style={{width:'100%',background:'#2B7FFF',color:'#fff',fontSize:'13px',fontWeight:'500',padding:'12px',borderRadius:'12px',border:'none',cursor:'pointer'}}>
                  💸 Voir les finances
                </button>
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
