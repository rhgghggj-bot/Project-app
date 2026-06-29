'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const COULEURS = ['#f97316','#1368ce','#26890c','#d89e00']
const FORMES = ['▲','◆','●','■']

export default function QuizPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [quizList, setQuizList] = useState<any[]>([])
  const [mode, setMode] = useState<'liste'|'creer'|'jouer'|'resultats'>('liste')
  const [quizActif, setQuizActif] = useState<any>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [reponses, setReponses] = useState<number[]>([])
  const [score, setScore] = useState<number|null>(null)
  const [loading, setLoading] = useState(false)
  const [titre, setTitre] = useState('')
  const [questions, setQuestions] = useState([{ question: '', options: ['','','',''], reponse: 0 }])
  const [genSujet, setGenSujet] = useState('')
  const [generating, setGenerating] = useState(false)

  const bg = '#46178f'
  const card = 'rgba(255,255,255,0.1)'
  const border = '1px solid rgba(255,255,255,0.2)'

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data } = await supabase.from('quiz').select('*').eq('groupe_id', params.id).order('created_at', { ascending: false })
      setQuizList(data || [])
    }
    init()
  }, [])

  async function genererAvecIA() {
    if (!genSujet) return
    setGenerating(true)
    try {
      const res = await fetch('/api/quiz-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sujet: genSujet })
      })
      const parsed = await res.json()
      setTitre(parsed.titre)
      setQuestions(parsed.questions)
    } catch(e) { console.error(e) }
    setGenerating(false)
  }

  async function sauvegarderQuiz() {
    if (!titre) return
    setLoading(true)
    const { error } = await supabase.from('quiz').insert({ groupe_id: params.id, createur_id: user.id, titre, questions })
    if (!error) {
      const { data } = await supabase.from('quiz').select('*').eq('groupe_id', params.id).order('created_at', { ascending: false })
      setQuizList(data || [])
      setMode('liste')
      setTitre('')
      setQuestions([{ question: '', options: ['','','',''], reponse: 0 }])
    }
    setLoading(false)
  }

  function commencerQuiz(quiz: any) {
    setQuizActif(quiz); setQuestionIndex(0); setReponses([]); setScore(null); setMode('jouer')
  }

  function repondre(i: number) {
    const nouv = [...reponses, i]
    setReponses(nouv)
    if (questionIndex + 1 < quizActif.questions.length) {
      setQuestionIndex(questionIndex + 1)
    } else {
      const sc = nouv.reduce((t, r, idx) => t + (r === quizActif.questions[idx].reponse ? 1 : 0), 0)
      setScore(sc)
      supabase.from('quiz_reponses').insert({ quiz_id: quizActif.id, user_id: user.id, reponses: nouv, score: sc })
      setMode('resultats')
    }
  }

  const s = { main: { minHeight:'100vh', background: bg, padding:'20px 18px' } as any }

  if (mode === 'jouer' && quizActif) {
    const q = quizActif.questions[questionIndex]
    const pct = (questionIndex / quizActif.questions.length) * 100
    return (
      <main style={s.main}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
          <button onClick={() => setMode('liste')} style={{color:'rgba(255,255,255,0.6)',background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
          <span style={{background:'rgba(255,255,255,0.15)',color:'#fff',fontSize:'12px',padding:'4px 12px',borderRadius:'99px'}}>{questionIndex+1} / {quizActif.questions.length}</span>
        </div>
        <div style={{background:'rgba(255,255,255,0.15)',borderRadius:'99px',height:'8px',marginBottom:'20px',overflow:'hidden'}}>
          <div style={{height:'100%',width:pct+'%',background:'linear-gradient(90deg,#7c3aed,#a855f7)',borderRadius:'99px',transition:'width 0.3s'}}></div>
        </div>
        <div style={{background:'rgba(255,255,255,0.12)',border,borderRadius:'20px',padding:'24px',marginBottom:'20px',textAlign:'center'}}>
          <div style={{color:'rgba(255,255,255,0.5)',fontSize:'11px',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Question {questionIndex+1}</div>
          <div style={{color:'#fff',fontSize:'18px',fontWeight:'500',lineHeight:'1.4'}}>{q.question}</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
          {q.options.map((opt: string, i: number) => (
            <button key={i} onClick={() => repondre(i)}
              style={{background:COULEURS[i],borderRadius:'14px',padding:'16px',display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',border:'none',textAlign:'left'}}>
              <span style={{fontSize:'18px',color:'#fff'}}>{FORMES[i]}</span>
              <span style={{color:'#fff',fontSize:'13px',fontWeight:'500'}}>{opt}</span>
            </button>
          ))}
        </div>
      </main>
    )
  }

  if (mode === 'resultats') {
    const total = quizActif.questions.length
    const pct = Math.round((score! / total) * 100)
    return (
      <main style={{...s.main,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <div style={{fontSize:'64px',marginBottom:'16px'}}>{pct>=80?'🏆':pct>=60?'🎉':pct>=40?'👍':'💪'}</div>
        <div style={{color:'#fff',fontSize:'28px',fontWeight:'500',marginBottom:'4px'}}>{score}/{total}</div>
        <div style={{color:'#a855f7',fontSize:'15px',marginBottom:'32px'}}>{pct}% de bonnes reponses</div>
        <div style={{width:'100%',background:'rgba(255,255,255,0.1)',border,borderRadius:'20px',padding:'20px',marginBottom:'24px'}}>
          {quizActif.questions.map((q: any, i: number) => (
            <div key={i} style={{display:'flex',gap:'10px',marginBottom:'12px',alignItems:'flex-start'}}>
              <span style={{fontSize:'18px',flexShrink:0}}>{reponses[i]===q.reponse?'✅':'❌'}</span>
              <div>
                <div style={{color:'rgba(255,255,255,0.8)',fontSize:'13px',marginBottom:'3px'}}>{q.question}</div>
                {reponses[i]!==q.reponse&&<div style={{color:'#4ade80',fontSize:'12px'}}>Bonne reponse: {q.options[q.reponse]}</div>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setMode('liste')} style={{background:'#26890c',color:'#fff',border:'none',borderRadius:'14px',padding:'14px 32px',fontSize:'15px',fontWeight:'500',cursor:'pointer'}}>
          Retour aux quiz
        </button>
      </main>
    )
  }

  if (mode === 'creer') {
    return (
      <main style={{...s.main}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
          <button onClick={() => setMode('liste')} style={{color:'rgba(255,255,255,0.6)',background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
          <span style={{color:'#fff',fontWeight:'500',fontSize:'16px'}}>Créer un quiz</span>
        </div>
        <div style={{background:'rgba(255,255,255,0.08)',border:'1px dashed rgba(255,255,255,0.3)',borderRadius:'16px',padding:'16px',marginBottom:'16px'}}>
          <div style={{color:'#a855f7',fontSize:'13px',fontWeight:'500',marginBottom:'8px'}}>✨ Générer avec l'IA</div>
          <div style={{display:'flex',gap:'8px'}}>
            <input value={genSujet} onChange={e=>setGenSujet(e.target.value)} placeholder="Ex: Histoire de France, Foot..."
              style={{flex:1,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#fff'}}/>
            <button onClick={genererAvecIA} disabled={generating}
              style={{background:'#f97316',color:'#fff',border:'none',borderRadius:'10px',padding:'8px 16px',fontSize:'13px',cursor:'pointer',fontWeight:'500'}}>
              {generating?'...':'Go'}
            </button>
          </div>
        </div>
        <input value={titre} onChange={e=>setTitre(e.target.value)} placeholder="Titre du quiz"
          style={{width:'100%',background:'rgba(255,255,255,0.1)',border,borderRadius:'12px',padding:'12px 14px',fontSize:'14px',color:'#fff',marginBottom:'14px'}}/>
        {questions.map((q,qi) => (
          <div key={qi} style={{background:'rgba(255,255,255,0.08)',border,borderRadius:'16px',padding:'14px',marginBottom:'12px'}}>
            <div style={{color:'#a855f7',fontSize:'12px',fontWeight:'500',marginBottom:'8px'}}>Question {qi+1}</div>
            <input value={q.question} onChange={e=>{const nq=[...questions];nq[qi].question=e.target.value;setQuestions(nq)}}
              placeholder="Question..."
              style={{width:'100%',background:'rgba(255,255,255,0.1)',border,borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#fff',marginBottom:'8px'}}/>
            {q.options.map((opt,oi) => (
              <div key={oi} style={{display:'flex',gap:'6px',marginBottom:'6px',alignItems:'center'}}>
                <button onClick={()=>{const nq=[...questions];nq[qi].reponse=oi;setQuestions(nq)}}
                  style={{width:'32px',height:'32px',borderRadius:'8px',border:'none',background:q.reponse===oi?COULEURS[oi]:'rgba(255,255,255,0.15)',color:'#fff',cursor:'pointer',flexShrink:0,fontSize:'14px'}}>
                  {FORMES[oi]}
                </button>
                <input value={opt} onChange={e=>{const nq=[...questions];nq[qi].options[oi]=e.target.value;setQuestions(nq)}}
                  placeholder={'Option '+['A','B','C','D'][oi]}
                  style={{flex:1,background:'rgba(255,255,255,0.1)',border,borderRadius:'8px',padding:'6px 10px',fontSize:'13px',color:'#fff'}}/>
              </div>
            ))}
          </div>
        ))}
        <button onClick={()=>setQuestions([...questions,{question:'',options:['','','',''],reponse:0}])}
          style={{width:'100%',background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.7)',border:'1px dashed rgba(255,255,255,0.3)',borderRadius:'12px',padding:'10px',fontSize:'13px',cursor:'pointer',marginBottom:'12px'}}>
          + Ajouter une question
        </button>
        <button onClick={sauvegarderQuiz} disabled={loading}
          style={{width:'100%',background:'#26890c',color:'#fff',border:'none',borderRadius:'14px',padding:'14px',fontSize:'14px',fontWeight:'500',cursor:'pointer',marginBottom:'24px'}}>
          {loading?'Sauvegarde...':'Publier le quiz'}
        </button>
      </main>
    )
  }

  return (
    <main style={s.main}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <button onClick={()=>router.back()} style={{color:'rgba(255,255,255,0.6)',background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
          <span style={{color:'#fff',fontWeight:'500',fontSize:'16px'}}>🗺️ Quiz</span>
        </div>
        <button onClick={()=>setMode('creer')} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',borderRadius:'99px',padding:'8px 16px',fontSize:'13px',cursor:'pointer',fontWeight:'500'}}>
          + Créer
        </button>
      </div>

      <div style={{background:'rgba(255,255,255,0.08)',border:'1px dashed rgba(255,255,255,0.3)',borderRadius:'16px',padding:'16px',marginBottom:'16px'}}>
        <div style={{color:'#a855f7',fontSize:'13px',fontWeight:'500',marginBottom:'8px'}}>✨ Générer avec l'IA</div>
        <div style={{display:'flex',gap:'8px'}}>
          <input value={genSujet} onChange={e=>setGenSujet(e.target.value)} placeholder="Ex: Histoire de France, Foot..."
            style={{flex:1,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#fff'}}/>
          <button onClick={()=>{setGenSujet(genSujet);setMode('creer');setTimeout(genererAvecIA,100)}} disabled={generating}
            style={{background:'#f97316',color:'#fff',border:'none',borderRadius:'10px',padding:'8px 16px',fontSize:'13px',cursor:'pointer',fontWeight:'500'}}>
            {generating?'...':'Go'}
          </button>
        </div>
      </div>

      {quizList.length===0 && (
        <div style={{textAlign:'center',padding:'48px 0',color:'rgba(255,255,255,0.5)'}}>
          <div style={{fontSize:'48px',marginBottom:'12px'}}>🗺️</div>
          <div style={{fontSize:'14px',marginBottom:'8px'}}>Aucun quiz pour l'instant</div>
          <button onClick={()=>setMode('creer')} style={{color:'#a855f7',fontSize:'13px',fontWeight:'500',background:'none',border:'none',cursor:'pointer'}}>
            Crée le premier quiz →
          </button>
        </div>
      )}

      {quizList.map((quiz:any,idx:number) => (
        <div key={quiz.id} style={{background:'rgba(255,255,255,0.08)',border,borderRadius:'20px',overflow:'hidden',marginBottom:'12px'}}>
          <div style={{padding:'18px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
              <div style={{width:'44px',height:'44px',borderRadius:'12px',background:COULEURS[idx%4],display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>
                🗺️
              </div>
              <div>
                <div style={{color:'#fff',fontWeight:'500',fontSize:'14px'}}>{quiz.titre}</div>
                <div style={{color:'rgba(255,255,255,0.5)',fontSize:'11px',marginTop:'2px'}}>{quiz.questions.length} questions · {new Date(quiz.created_at).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
            <button onClick={()=>commencerQuiz(quiz)}
              style={{width:'100%',background:'#26890c',color:'#fff',border:'none',borderRadius:'12px',padding:'12px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>
              🎮 Jouer
            </button>
          </div>
        </div>
      ))}
    </main>
  )
}
