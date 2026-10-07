"use client"
import { useState } from "react"
import { colors, radius } from "@/app/components/ui/tokens"
import type { QuestionQuiz } from "@/lib/etudes"

// Quiz à choix multiples : une question à la fois, explication après chaque
// réponse, score à la fin (transmis via onTermine pour suivre la progression).
export default function Quiz({ questions, onTermine }: { questions: QuestionQuiz[]; onTermine?: (score: number, total: number) => void }) {
  const [index, setIndex] = useState(0)
  const [choix, setChoix] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [fini, setFini] = useState(false)

  if (questions.length === 0) return null

  if (fini) {
    const reussi = score / questions.length >= 0.6
    return (
      <div style={{ background: reussi ? colors.greenLight : colors.goldLight, borderRadius: radius.md, padding: "16px", textAlign: "center" }}>
        <div style={{ fontSize: "22px", fontWeight: 600, color: colors.text }}>{score} / {questions.length}</div>
        <div style={{ fontSize: "13px", color: colors.textMuted, margin: "4px 0 12px" }}>
          {reussi ? "Bien joué, la notion est en place." : "Relis les explications et recommence, ça va rentrer."}
        </div>
        <button onClick={() => { setIndex(0); setChoix(null); setScore(0); setFini(false) }}
          style={{ background: colors.blue, color: "#fff", border: "none", borderRadius: radius.pill, padding: "8px 18px", fontSize: "13px", cursor: "pointer" }}>
          Recommencer
        </button>
      </div>
    )
  }

  const q = questions[index]
  const repondu = choix !== null

  function repondre(i: number) {
    if (repondu) return
    setChoix(i)
    if (i === q.bonne) setScore(s => s + 1)
  }

  function suivante() {
    if (index + 1 >= questions.length) {
      setFini(true)
      onTermine?.(score, questions.length)
    } else {
      setIndex(index + 1)
      setChoix(null)
    }
  }

  return (
    <div>
      <div style={{ fontSize: "11px", color: colors.textFaint, marginBottom: "6px" }}>Question {index + 1} / {questions.length}</div>
      <div style={{ fontSize: "14px", fontWeight: 500, color: colors.text, marginBottom: "10px", lineHeight: 1.45 }}>{q.question}</div>
      <div role="radiogroup" aria-label={q.question} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {q.choix.map((c, i) => {
          const estBonne = i === q.bonne
          const estChoisie = i === choix
          const fond = !repondu ? "#fff" : estBonne ? colors.greenLight : estChoisie ? colors.redLight : "#fff"
          const bord = !repondu ? colors.blueBorder : estBonne ? colors.green : estChoisie ? colors.red : colors.border
          return (
            <button key={i} role="radio" aria-checked={estChoisie} onClick={() => repondre(i)} disabled={repondu}
              style={{ textAlign: "left", background: fond, border: `1px solid ${bord}`, borderRadius: radius.sm, padding: "10px 12px", fontSize: "13px", color: colors.text, cursor: repondu ? "default" : "pointer" }}>
              {c}
            </button>
          )
        })}
      </div>
      {repondu && (
        <div style={{ marginTop: "10px" }}>
          <div style={{ fontSize: "12px", color: colors.textMuted, lineHeight: 1.5, background: colors.blueLight, borderRadius: radius.sm, padding: "10px 12px" }}>
            <b style={{ color: choix === q.bonne ? colors.green : colors.red }}>{choix === q.bonne ? "Juste. " : "Pas tout à fait. "}</b>
            {q.explication}
          </div>
          <button onClick={suivante}
            style={{ marginTop: "10px", background: colors.blue, color: "#fff", border: "none", borderRadius: radius.pill, padding: "8px 18px", fontSize: "13px", cursor: "pointer" }}>
            {index + 1 >= questions.length ? "Voir mon score" : "Question suivante"}
          </button>
        </div>
      )}
    </div>
  )
}
