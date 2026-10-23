import type { Metadata } from "next"
import Link from "next/link"
import PageLegale from "@/app/components/PageLegale"
import { LEGAL } from "@/lib/legal"
import s from "@/app/components/legal.module.css"

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: "Les règles d'utilisation de Nexia : compte, contenus, marketplace, paiements, responsabilité.",
  alternates: { canonical: "/cgu" },
}

export default function Cgu() {
  return (
    <PageLegale titre="Conditions générales d'utilisation">
      <div className={s.encadre}>
        <b>En bref :</b> Nexia est gratuit. Tu restes propriétaire de tes contenus, tu es responsable de ce que tu publies, et les estimations (impôts, finances) sont indicatives.
      </div>

      <h2>1. Objet</h2>
      <p>Ces conditions règlent l&apos;utilisation de l&apos;application Nexia ({LEGAL.site}), éditée par {LEGAL.nom}. En créant un compte, tu les acceptes.</p>

      <h2>2. Compte</h2>
      <ul>
        <li>Tu dois donner une adresse e-mail valable et garder ton mot de passe secret.</li>
        <li>Si tu as moins de 16 ans, l&apos;accord de tes parents est nécessaire.</li>
        <li>Un compte est personnel. Tu peux demander sa suppression à tout moment à <a href={`mailto:${LEGAL.contact}`}>{LEGAL.contact}</a>.</li>
      </ul>

      <h2>3. Services</h2>
      <p>Nexia propose notamment un espace étudiant (notes, fiches, révisions, bibliothèque), un suivi des finances, un calendrier, des groupes, une marketplace, des projets à soutenir et une estimation des impôts. Les services sont fournis gratuitement, tels quels, et peuvent évoluer. Nous faisons notre possible pour qu&apos;ils soient disponibles, sans pouvoir le garantir en permanence.</p>

      <h2>4. Tes contenus</h2>
      <ul>
        <li>Tu restes propriétaire de ce que tu crées ou importes (notes, documents, photos, messages).</li>
        <li>Tu nous autorises seulement à les enregistrer et à les afficher pour faire fonctionner l&apos;appli.</li>
        <li>N&apos;importe que des documents que tu as le droit d&apos;utiliser (par exemple les supports de tes cours, pour ton usage personnel).</li>
      </ul>

      <h2>5. Règles de comportement</h2>
      <p>Il est interdit de publier des contenus illégaux, haineux, violents ou trompeurs, de harceler d&apos;autres utilisateurs, d&apos;envoyer des messages publicitaires non sollicités (spam) ou d&apos;essayer de contourner la sécurité de l&apos;appli. Un compte qui ne respecte pas ces règles peut être suspendu ou supprimé.</p>

      <h2>6. Marketplace, dépenses partagées et projets</h2>
      <ul>
        <li>Les ventes se font entre utilisateurs. Le vendeur est responsable de ce qu&apos;il vend et de la description de son annonce.</li>
        <li>Les paiements sont traités par Stripe, selon ses propres conditions. Le paiement d&apos;un achat est retenu jusqu&apos;à la confirmation de la réception.</li>
        <li>Nexia n&apos;est pas partie aux ventes entre utilisateurs. En cas de problème, contacte-nous : nous pouvons aider à trouver une solution.</li>
      </ul>

      <h2>7. Estimations et contenus pédagogiques</h2>
      <p>Les calculs d&apos;impôts, les bilans financiers et les fiches générées automatiquement sont des aides. Ils peuvent contenir des erreurs et ne remplacent ni un conseil professionnel, ni le calculateur officiel de ton canton, ni ton cours.</p>

      <h2>8. Responsabilité</h2>
      <p>Dans les limites permises par la loi, Nexia n&apos;est pas responsable des dommages indirects, des pertes de données dues à une mauvaise utilisation, ni des décisions prises sur la base des estimations. Pense à exporter régulièrement tes données importantes.</p>

      <h2>9. Données personnelles</h2>
      <p>Le traitement de tes données est décrit dans la <Link href="/confidentialite">politique de confidentialité</Link>.</p>

      <h2>10. Modifications et droit applicable</h2>
      <p>Ces conditions peuvent être modifiées ; la date de mise à jour est indiquée en haut de la page. Elles sont soumises au droit suisse. Le for est à Genève, sous réserve des règles impératives qui protègent les consommateurs.</p>
    </PageLegale>
  )
}
