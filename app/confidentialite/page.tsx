import type { Metadata } from "next"
import Link from "next/link"
import PageLegale from "@/app/components/PageLegale"
import { LEGAL } from "@/lib/legal"
import s from "@/app/components/legal.module.css"

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Quelles données Nexia utilise, pourquoi, avec qui elles sont partagées et comment exercer tes droits (LPD suisse et RGPD).",
  alternates: { canonical: "/confidentialite" },
}

// Politique de confidentialité : loi fédérale sur la protection des données
// (nLPD, Suisse) et RGPD (Union européenne, pour les utilisateurs en France)
export default function Confidentialite() {
  const mail = <a href={`mailto:${LEGAL.contact}`}>{LEGAL.contact}</a>
  return (
    <PageLegale titre="Politique de confidentialité">
      <div className={s.encadre}>
        <b>En bref :</b> Nexia utilise tes données uniquement pour faire fonctionner l&apos;appli. Pas de publicité, pas de revente de données, pas de cookies publicitaires. Tu peux récupérer ou faire effacer tes données à tout moment.
      </div>

      <h2>1. Qui est responsable ?</h2>
      <p>Le responsable du traitement est {LEGAL.nom}. Pour toute question sur tes données : {mail}.</p>
      <p>Cette politique s&apos;applique selon la loi fédérale suisse sur la protection des données (nLPD) et, pour les personnes qui utilisent Nexia depuis l&apos;Union européenne (par exemple la France), selon le Règlement général sur la protection des données (RGPD).</p>

      <h2>2. Quelles données et pourquoi ?</h2>
      <div className={s.defile}>
        <table className={s.tableau}>
          <thead><tr><th>Données</th><th>À quoi elles servent</th><th>Base légale (RGPD)</th></tr></thead>
          <tbody>
            <tr><td>Compte : e-mail, prénom, mot de passe (chiffré)</td><td>Créer ton compte et te connecter</td><td>Exécution du contrat</td></tr>
            <tr><td>Profil étudiant : pays, niveau, école, filière</td><td>Te proposer tes matières et tes chapitres</td><td>Exécution du contrat</td></tr>
            <tr><td>Études : notes, cours, fiches, carnet, dessins, documents importés, résultats de quiz</td><td>L&apos;espace étudiant</td><td>Exécution du contrat</td></tr>
            <tr><td>Finances : revenus, dépenses, budgets, objectifs d&apos;épargne</td><td>Le suivi de ton budget</td><td>Exécution du contrat</td></tr>
            <tr><td>Calendrier et rappels</td><td>Ton agenda et les notifications</td><td>Exécution du contrat</td></tr>
            <tr><td>Groupes : messages, dépenses partagées, sondages, appels</td><td>Les discussions et l&apos;organisation entre membres</td><td>Exécution du contrat</td></tr>
            <tr><td>Marketplace et projets : annonces, photos, avis, soutiens</td><td>Acheter, vendre et soutenir des projets</td><td>Exécution du contrat</td></tr>
            <tr><td>Statistiques de visite anonymes</td><td>Savoir quelles pages sont utilisées et si elles sont rapides</td><td>Intérêt légitime</td></tr>
          </tbody>
        </table>
      </div>
      <p>Nexia ne demande jamais tes coordonnées bancaires : les paiements par carte sont traités directement par Stripe.</p>

      <h2>3. Avec qui sont-elles partagées ?</h2>
      <p>Tes données ne sont jamais vendues. Elles passent uniquement par les services techniques nécessaires à l&apos;appli :</p>
      <ul>
        <li><b>Supabase</b> : base de données, comptes et fichiers (hébergement).</li>
        <li><b>Vercel</b> : hébergement du site et statistiques de visite anonymes (sans cookies).</li>
        <li><b>Stripe</b> : paiements de la marketplace, des dépenses partagées et des projets.</li>
        <li><b>LiveKit</b> : appels audio et vidéo dans les groupes.</li>
        <li><b>Anthropic (Claude)</b> : seulement si tu utilises l&apos;analyse automatique d&apos;un cours ou d&apos;une évaluation ; le document envoyé sert uniquement à produire tes fiches ou ta correction.</li>
      </ul>
      <p>Les membres d&apos;un groupe voient ce que tu publies dans ce groupe. Une annonce de la marketplace est visible des autres utilisateurs. Une note que tu partages par lien est contenue dans le lien lui-même et n&apos;est pas enregistrée sur nos serveurs.</p>
      <p>Certains de ces services peuvent traiter des données hors de Suisse et de l&apos;Union européenne (notamment aux États-Unis). Ces transferts sont encadrés par des garanties reconnues (clauses contractuelles types, Data Privacy Framework).</p>

      <h2>4. Ce qui reste sur ton appareil</h2>
      <p>Nexia enregistre dans ton navigateur (stockage local) ce qui est nécessaire à son fonctionnement : ta session de connexion, tes préférences, tes brouillons et une copie de tes notes pour le mode hors connexion. La lecture des documents scannés (reconnaissance du texte) se fait aussi sur ton appareil. Il n&apos;y a pas de cookies publicitaires ni de traceurs tiers.</p>

      <h2>5. Combien de temps ?</h2>
      <p>Tes données sont gardées tant que ton compte existe. Si tu demandes la suppression de ton compte, elles sont effacées dans un délai de 30 jours, sauf ce que la loi oblige à conserver (par exemple les justificatifs de paiement, 10 ans en Suisse).</p>

      <h2>6. Tes droits</h2>
      <ul>
        <li><b>Accès et portabilité</b> : tu peux télécharger tes données d&apos;études à tout moment depuis l&apos;espace étudiant (export), ou demander une copie de toutes tes données.</li>
        <li><b>Rectification</b> : tu peux modifier tes informations dans l&apos;appli.</li>
        <li><b>Effacement</b> : tu peux supprimer tes contenus dans l&apos;appli, ou demander la suppression de ton compte.</li>
        <li><b>Opposition et limitation</b>, notamment aux statistiques de visite.</li>
      </ul>
      <p>Pour exercer ces droits, écris à {mail}. Nous répondons dans un délai de 30 jours. Tu peux aussi t&apos;adresser au Préposé fédéral à la protection des données (PFPDT, Suisse) ou à la CNIL (France).</p>

      <h2>7. Sécurité</h2>
      <p>Les échanges sont chiffrés (HTTPS), les mots de passe ne sont jamais stockés en clair et chaque utilisateur n&apos;a accès qu&apos;à ses propres données. Les clés d&apos;accès aux services techniques restent sur le serveur.</p>

      <h2>8. Modifications</h2>
      <p>Cette politique peut évoluer. La date de mise à jour est indiquée en haut de la page. Voir aussi les <Link href="/cgu">conditions d&apos;utilisation</Link>.</p>
    </PageLegale>
  )
}
