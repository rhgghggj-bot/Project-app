"use client"
import { colors, radius } from "@/app/components/ui/tokens"
import { quizValide, type QuestionQuiz } from "@/lib/etudes"
import { Exercice, titreCarte } from "./Depot"
import Quiz from "./Quiz"

export type ContenuFiche = {
  titre: string
  resume: string
  points: string[]
  vocabulaire: { mot: string; definition: string }[]
  exemple: string
  exercice: { enonce: string; solution: string }
  quiz: QuestionQuiz[]
}

// Une fiche de révision : résumé, points clés, vocabulaire, exemple concret,
// exercice corrigé et quiz. Sert aux cours importés et aux programmes.
export default function FicheNotion({ fiche, libelleExemple, cleQuiz, onQuizTermine }: {
  fiche: ContenuFiche
  libelleExemple: string
  cleQuiz: string
  onQuizTermine?: (score: number, total: number) => void
}) {
  const quiz = quizValide(fiche.quiz)
  return (
    <div>
      <div style={{ fontSize: "15px", fontWeight: 600, color: colors.text, marginBottom: "6px" }}>{fiche.titre}</div>
      <p style={{ fontSize: "13px", color: colors.textMuted, lineHeight: 1.55, margin: "0 0 8px", whiteSpace: "pre-line" }}>{fiche.resume}</p>
      {fiche.points.length > 0 && (
        <ul style={{ margin: "0 0 10px", paddingLeft: "18px", listStyle: "disc" }}>
          {fiche.points.map((p, i) => <li key={i} style={{ fontSize: "13px", color: colors.text, lineHeight: 1.5, marginBottom: "3px" }}>{p}</li>)}
        </ul>
      )}
      {fiche.vocabulaire.length > 0 && (
        <div style={{ background: colors.blueLight, borderRadius: radius.sm, padding: "10px 12px", marginBottom: "10px" }}>
          <div style={{ fontSize: "12px", fontWeight: 500, color: colors.blue, marginBottom: "4px" }}>Vocabulaire</div>
          {fiche.vocabulaire.map((v, i) => <div key={i} style={{ fontSize: "12px", color: colors.text, lineHeight: 1.5 }}><b>{v.mot}</b> : {v.definition}</div>)}
        </div>
      )}
      {fiche.exemple && (
        <div style={{ background: colors.goldLight, borderRadius: radius.sm, padding: "10px 12px", marginBottom: "10px" }}>
          <div style={{ fontSize: "12px", fontWeight: 500, color: "#92400E", marginBottom: "4px" }}>{libelleExemple}</div>
          <div style={{ fontSize: "12px", color: colors.text, lineHeight: 1.5, whiteSpace: "pre-line" }}>{fiche.exemple}</div>
        </div>
      )}
      {fiche.exercice.enonce && <Exercice numero={1} enonce={fiche.exercice.enonce} solution={fiche.exercice.solution} />}
      {quiz.length > 0 && (
        <div style={{ background: "#F8FBFF", borderRadius: radius.sm, padding: "12px", marginTop: "6px" }}>
          <div style={titreCarte}>Teste-toi</div>
          <Quiz key={cleQuiz} questions={quiz} onTermine={onQuizTermine} />
        </div>
      )}
    </div>
  )
}
