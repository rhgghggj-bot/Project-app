"use client"
import { colors, radius } from "@/app/components/ui/tokens"
import { quizValide, type QuestionQuiz } from "@/lib/etudes"
import { Exercice, titreCarte } from "./Depot"
import Quiz from "./Quiz"
import { schemaSur } from "@/lib/schema"
import { CSS_SCHEMAS } from "@/lib/schemaCss"

export type ContenuFiche = {
  titre: string
  resume: string
  points: string[]
  vocabulaire: { mot: string; definition: string }[]
  exemple: string
  exercice: { enonce: string; solution: string }
  quiz: QuestionQuiz[]
  // Données en plus des fiches importées d'un artefact
  schema?: string
  videos?: { titre: string; url: string; duree?: string }[]
  exercices?: { enonce: string; solution: string }[]
}

function Schema({ html }: { html: string }) {
  const sur = schemaSur(html)
  if (!sur) return null
  return (
    <div className="schema-bise">
      <style>{CSS_SCHEMAS}</style>
      <div dangerouslySetInnerHTML={{ __html: sur }} />
    </div>
  )
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
      {fiche.schema && <Schema html={fiche.schema} />}
      {fiche.videos && fiche.videos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
          {fiche.videos.filter(v => /^https?:\/\//.test(v.url)).map((v, i) => (
            <a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: "10px", border: `1px solid ${colors.blueBorder}`, borderRadius: radius.sm, padding: "8px 10px", textDecoration: "none", color: colors.text, fontSize: "13px" }}>
              <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: "50%", background: colors.navy, color: "#fff", display: "grid", placeItems: "center", fontSize: "10px", flexShrink: 0 }}>▶</span>
              <span style={{ flex: 1 }}>{v.titre}</span>
              {v.duree && <span style={{ fontSize: "11px", color: "#6B7280" }}>{v.duree}</span>}
            </a>
          ))}
        </div>
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
      {(fiche.exercices || []).filter(e => e.enonce).map((e, i) => (
        <Exercice key={i} numero={i + (fiche.exercice.enonce ? 2 : 1)} enonce={e.enonce} solution={e.solution} />
      ))}
      {quiz.length > 0 && (
        <div style={{ background: "#F8FBFF", borderRadius: radius.sm, padding: "12px", marginTop: "6px" }}>
          <div style={titreCarte}>Teste-toi</div>
          <Quiz key={cleQuiz} questions={quiz} onTermine={onQuizTermine} />
        </div>
      )}
    </div>
  )
}
