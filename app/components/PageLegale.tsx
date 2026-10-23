import Link from "next/link"
import { LEGAL } from "@/lib/legal"
import s from "./legal.module.css"

// Mise en page commune des pages légales (confidentialité, CGU)
export default function PageLegale({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <main className={s.page}>
      <header className={s.barre}>
        <Link href="/">
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 60 60">
            <path d="M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z" fill="url(#legGrad)" />
            <defs><linearGradient id="legGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#2B7FFF" /><stop offset="100%" stopColor="#D4A843" /></linearGradient></defs>
          </svg>
          NEXIA
        </Link>
      </header>
      <article className={s.contenu}>
        <h1>{titre}</h1>
        <p className={s.maj}>Dernière mise à jour : {LEGAL.miseAJour}</p>
        {children}
        <nav className={s.liens} aria-label="Pages légales">
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/cgu">Conditions d&apos;utilisation</Link>
          <Link href="/">Retour à Nexia</Link>
        </nav>
      </article>
    </main>
  )
}
