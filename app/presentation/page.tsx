import Link from "next/link"
import type { Metadata } from "next"
import Vitrine from "@/app/components/Vitrine"
import s from "./presentation.module.css"

// Présentation unique de Nexia (remplace l'ancienne introduction en trois
// écrans et l'ancienne présentation 3D) : l'espace étudiant d'abord, puis le
// reste de l'appli. Page publique, sans compte.

export const metadata: Metadata = {
  title: { absolute: "Nexia — Révise moins longtemps, retiens mieux" },
  alternates: { canonical: "/presentation" },
  description: "Espace étudiant (notes, carnet avec crayon surligneur, cartes de révision, planning d'examen, bibliothèque), finances, groupes, calendrier et impôts suisses : gratuit et sans publicité.",
}

const Ico = ({ d }: { d: string }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)

const OUTILS = [
  { nom: "Finances", couleur: "#86efac", ico: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6", accroche: "Chaque franc, sous contrôle.",
    points: ["Revenus, dépenses et budgets par catégorie", "Graphique de ton solde et bilan de l'année", "Objectifs d'épargne et choix de la monnaie"] },
  { nom: "Groupes et discussions", couleur: "#a8d8f0", ico: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87", accroche: "Organisez-vous, ensemble.",
    points: ["Discussions en direct et appels vidéo", "Dépenses partagées, remboursées par carte dans l'appli", "Sondages, disponibilités, listes et mode colocation"] },
  { nom: "Calendrier", couleur: "#fcd34d", ico: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18", accroche: "Ta semaine d'un coup d'œil.",
    points: ["Importe ton emploi du temps (.ics)", "Activités de tes groupes ajoutées automatiquement", "Rappels 1 h, 30 min et 10 min avant"] },
  { nom: "Impôts suisses", couleur: "#f9a8d4", ico: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6", accroche: "Une idée de tes impôts en quelques champs.",
    points: ["Genève, Vaud, Valais, Fribourg, Neuchâtel, Jura", "3e pilier, frais professionnels, primes maladie", "Aussi la France et le Sénégal"],
    note: "Estimation simplifiée, à vérifier avec le calculateur officiel." },
  { nom: "Marketplace", couleur: "#c4b5fd", ico: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0", accroche: "Vendre et acheter entre proches.",
    points: ["Petites annonces avec photos", "Paiement retenu jusqu'à la réception", "Avis sur les vendeurs"] },
  { nom: "Scanner", couleur: "#fdba74", ico: "M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 12h10", accroche: "Une photo, et c'est rangé.",
    points: ["Photographie une facture ou un document", "Le texte est lu automatiquement", "Envoie-le vers tes finances ou ton calendrier"] },
]

const VALEURS = ["Gratuit", "Sans publicité", "Données privées", "Pensé pour la Suisse romande et la France"]

export default function Presentation() {
  return (
    <main className={s.page}>
      <header className={s.barre}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, color: "#fff", textDecoration: "none" }}>
          <svg aria-hidden="true" width="26" height="26" viewBox="0 0 60 60">
            <path d="M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z" fill="url(#presGrad)" />
            <defs><linearGradient id="presGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#2B7FFF" /><stop offset="100%" stopColor="#D4A843" /></linearGradient></defs>
          </svg>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>NEXIA</span>
        </Link>
        <nav className={s.liens} aria-label="Compte">
          <Link href="/connexion" className={s.lien}>Connexion</Link>
          <Link href="/inscription" className={s.cta}>Créer mon compte</Link>
        </nav>
      </header>

      <div className={s.hero}>
        <Vitrine />
        <aside className={s.carteCta} aria-label="Commencer">
          <h2>Tout ton quotidien d&apos;étudiant dans une seule appli.</h2>
          <p>Crée ton compte en moins d&apos;une minute et choisis ton école : tes matières et les chapitres de ton programme sont déjà là.</p>
          <Link href="/inscription" className={s.gros}>Créer mon compte gratuitement</Link>
          <div className={s.valeurs}>{VALEURS.map(v => <span key={v}>{v}</span>)}</div>
        </aside>
      </div>

      <section className={s.section} aria-labelledby="titre-outils">
        <h2 id="titre-outils">Et tout le reste de ta vie, au même endroit.</h2>
        <p>Tes révisions sont reliées à ton calendrier, tes groupes à tes dépenses, tes ventes à tes finances. Pas besoin de jongler entre cinq applis.</p>
        <div className={s.grille}>
          {OUTILS.map(o => (
            <article key={o.nom} className={s.outil}>
              <div className={s.tete}>
                <span className={s.ico} style={{ background: o.couleur + "22", color: o.couleur }}><Ico d={o.ico} /></span>
                <h3>{o.nom}</h3>
              </div>
              <p className={s.accroche}>{o.accroche}</p>
              <ul>{o.points.map(p => <li key={p}>{p}</li>)}</ul>
              {o.note && <div className={s.note}>{o.note}</div>}
            </article>
          ))}
        </div>
      </section>

      <section className={s.fin}>
        <h2>Prêt à reprendre le contrôle ?</h2>
        <p>Rejoins Nexia gratuitement, en moins d&apos;une minute.</p>
        <Link href="/inscription" className={s.gros} style={{ minWidth: 260 }}>Créer mon compte gratuitement</Link>
      </section>
      <footer className={s.pied}>
        Nexia — Ton hub de vie. Fait en Suisse romande.
        <nav aria-label="Informations légales" style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
          <Link href="/confidentialite" style={{ color: "inherit", padding: "8px 4px" }}>Confidentialité</Link>
          <Link href="/cgu" style={{ color: "inherit", padding: "8px 4px" }}>Conditions d&apos;utilisation</Link>
        </nav>
      </footer>
    </main>
  )
}
