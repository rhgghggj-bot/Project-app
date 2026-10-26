// « Entraîne ton esprit » : estimations de Fermi, pensée probabiliste
// (calibration) et reconnaissance des techniques de manipulation (cold reading).
// L'avancement est gardé dans l'espace privé de l'élève (et une copie sur
// l'appareil pour le mode sans réseau).

import { supabase } from "./supabase"
import { memoriser, relire } from "./horsLigne"

// ─── Fermi ───
export type DefiFermi = {
  id: string; question: string; unite: string
  pistes: string[]              // questions pour découper le problème
  demarche: string[]            // une façon de raisonner, étape par étape
  reference: number; exact: boolean; source: string
}

export const DEFIS_FERMI: DefiFermi[] = [
  { id: "piscine", question: "Combien de litres d'eau contient une piscine olympique ?", unite: "litres",
    pistes: ["Quelles sont la longueur, la largeur et la profondeur d'une piscine olympique ?", "Combien de litres dans 1 m³ ?"],
    demarche: ["Dimensions : 50 m × 25 m, au moins 2 m de profondeur.", "Volume : 50 × 25 × 2 = 2 500 m³.", "1 m³ = 1 000 litres, donc 2 500 × 1 000 = 2 500 000 litres."],
    reference: 2_500_000, exact: true, source: "Dimensions minimales des règles de World Aquatics" },
  { id: "coeur", question: "Combien de fois ton cœur bat-il pendant une vie de 80 ans ?", unite: "battements",
    pistes: ["Combien de battements par minute au repos ?", "Combien de minutes dans une année ?"],
    demarche: ["Environ 70 battements par minute.", "Une année : 60 × 24 × 365 ≈ 525 000 minutes.", "70 × 525 000 ≈ 37 millions par an.", "× 80 ans ≈ 3 milliards de battements."],
    reference: 2_950_000_000, exact: false, source: "Calcul avec une fréquence moyenne de 70 battements par minute" },
  { id: "cheveux", question: "Combien de cheveux y a-t-il sur une tête ?", unite: "cheveux",
    pistes: ["Quelle surface fait le cuir chevelu (en cm²) ?", "Combien de cheveux sur 1 cm² ?"],
    demarche: ["Cuir chevelu : environ 600 cm².", "Environ 150 à 200 cheveux par cm².", "600 × 170 ≈ 100 000 cheveux."],
    reference: 100_000, exact: false, source: "Ordre de grandeur couramment admis : 100 000 à 150 000" },
  { id: "secondes", question: "Combien de secondes dans une année ?", unite: "secondes",
    pistes: ["Combien de secondes dans une heure ?", "Combien d'heures dans une année ?"],
    demarche: ["Une heure : 3 600 secondes.", "Un jour : 24 × 3 600 = 86 400 secondes.", "Une année : 86 400 × 365 = 31 536 000 secondes."],
    reference: 31_536_000, exact: true, source: "Calcul exact (année de 365 jours)" },
  { id: "milliard", question: "En comptant un nombre par seconde, sans pause, combien d'années faut-il pour arriver à un milliard ?", unite: "années",
    pistes: ["Combien de secondes dans une année ?"],
    demarche: ["Une année ≈ 31,5 millions de secondes.", "1 000 000 000 ÷ 31 500 000 ≈ 32 ans."],
    reference: 31.7, exact: true, source: "Calcul exact" },
  { id: "suisse", question: "Combien d'habitants compte la Suisse ?", unite: "habitants",
    pistes: ["Combien d'habitants dans les grandes villes (Zurich, Genève…) ?", "Quelle part de la population vit dans les villes ?"],
    demarche: ["Zurich ≈ 0,4 million, Genève ≈ 0,2 million, Bâle, Lausanne, Berne ≈ 0,1 à 0,2 million chacune.", "Les grandes villes réunies ≈ 1,5 million, et elles ne regroupent qu'environ un sixième de la population.", "1,5 × 6 ≈ 9 millions."],
    reference: 9_000_000, exact: true, source: "Banque mondiale, 2024 (environ 9 millions)" },
  { id: "etudiants", question: "Combien d'étudiants y a-t-il dans l'enseignement supérieur en Suisse (universités, EPF, HES, HEP) ?", unite: "étudiants",
    pistes: ["Quelle part d'une génération fait des études supérieures ?", "Combien de jeunes par année d'âge, et combien d'années d'études ?"],
    demarche: ["Environ 90 000 jeunes par année d'âge en Suisse.", "Environ 4 personnes sur 10 font des études supérieures, souvent pendant 4 à 5 ans, plus les étudiants étrangers.", "90 000 × 0,4 × 4,5 ≈ 160 000, plus les étudiants plus âgés et étrangers : on arrive vers 300 000 à 350 000."],
    reference: 337_303, exact: true, source: "UNESCO, Institut de statistique (2024) — à revoir dans l'atlas" },
  { id: "soleil", question: "Combien de Terres pourrait-on mettre dans le Soleil (en volume) ?", unite: "Terres",
    pistes: ["Combien de fois le rayon du Soleil est-il plus grand que celui de la Terre ?", "Comment le volume change-t-il quand on multiplie le rayon ?"],
    demarche: ["Le rayon du Soleil est environ 109 fois celui de la Terre.", "Le volume grandit comme le cube du rayon : 109³.", "109³ ≈ 1 300 000 Terres."],
    reference: 1_300_000, exact: true, source: "Rapport des rayons (NASA)" },
  { id: "mots", question: "Combien de mots une personne prononce-t-elle en moyenne par jour ?", unite: "mots",
    pistes: ["Combien d'heures par jour passes-tu à parler ?", "Combien de mots par minute quand on parle ?"],
    demarche: ["On parle environ 1 h 30 à 2 h par jour, en tout.", "Environ 150 mots par minute, mais avec beaucoup de pauses.", "Une étude a mesuré environ 16 000 mots par jour, pour les femmes comme pour les hommes."],
    reference: 16_000, exact: false, source: "Mehl et al., Science, 2007" },
  { id: "geneve", question: "Combien de terrains de football faudrait-il pour couvrir tout le canton de Genève ?", unite: "terrains",
    pistes: ["Quelle est la superficie du canton de Genève (km²) ?", "Quelle est la taille d'un terrain de football (m²) ?"],
    demarche: ["Canton de Genève : environ 282 km² = 282 millions de m².", "Terrain : 105 m × 68 m ≈ 7 140 m².", "282 000 000 ÷ 7 140 ≈ 39 500 terrains."],
    reference: 39_500, exact: true, source: "Superficie officielle du canton, terrain aux dimensions FIFA" },
  { id: "handball", question: "Combien de buts sont marqués en une saison de Bundesliga de handball (18 équipes) ?", unite: "buts",
    pistes: ["Combien de matchs dans une saison où chaque équipe joue deux fois contre chaque autre ?", "Combien de buts dans un match, les deux équipes ensemble ?"],
    demarche: ["18 équipes, matchs aller-retour : 18 × 17 = 306 matchs.", "Un match de haut niveau : environ 28 à 30 buts par équipe, donc environ 57 au total.", "306 × 57 ≈ 17 500 buts."],
    reference: 17_500, exact: false, source: "Estimation avec une moyenne d'environ 57 buts par match" },
  { id: "piano", question: "Le défi de Fermi le plus célèbre : combien y a-t-il d'accordeurs de piano à Chicago (2,7 millions d'habitants) ?", unite: "accordeurs",
    pistes: ["Combien de foyers, et quelle part a un piano ?", "Combien de fois par an accorde-t-on un piano ?", "Combien de pianos un accordeur peut-il accorder par an ?"],
    demarche: ["2,7 millions d'habitants ≈ 1,1 million de foyers.", "Environ 1 foyer sur 20 a un piano : environ 55 000 pianos (plus les écoles, salles…).", "Un accord par an : environ 60 000 accordages par an.", "Un accordeur fait environ 4 pianos par jour × 250 jours = 1 000 par an.", "60 000 ÷ 1 000 ≈ 60 accordeurs : quelques dizaines à une centaine."],
    reference: 80, exact: false, source: "Exemple classique d'Enrico Fermi (ordre de grandeur, pas un chiffre officiel)" },
]

// Lit « 2,5 millions », « 3e9 », « 3'000'000 », « 2.5M », « 40k »…
export function lireNombre(texte: string): number | null {
  let t = texte.trim().toLowerCase().replace(/[\s'’ ]/g, "").replace(",", ".")
  let mult = 1
  const suffixes: [RegExp, number][] = [[/(milliards?|mrd|md|b)$/, 1e9], [/(millions?|mio|m)$/, 1e6], [/(mille|k)$/, 1e3]]
  for (const [r, m] of suffixes) if (r.test(t)) { mult = m; t = t.replace(r, ""); break }
  const n = Number(t)
  return isFinite(n) && t !== "" ? n * mult : null
}

export function ecartFermi(estimation: number, reference: number) {
  const facteur = Math.max(estimation, reference) / Math.max(1e-9, Math.min(estimation, reference))
  const niveau = facteur <= 2 ? "excellent" : facteur <= 3 ? "bon" : facteur <= 10 ? "moyen" : "loin"
  return { facteur, niveau } as const
}

// ─── Pensée probabiliste ───
export type Affirmation = { id: string; texte: string; vrai: boolean; explication: string }

export const AFFIRMATIONS: Affirmation[] = [
  { id: "a1", texte: "Le Mont Blanc est plus haut que le Kilimandjaro.", vrai: false, explication: "Mont Blanc : environ 4 806 m ; Kilimandjaro : 5 895 m." },
  { id: "a2", texte: "La Suisse compte 26 cantons.", vrai: true, explication: "26 cantons, dont 6 anciens « demi-cantons »." },
  { id: "a3", texte: "Le cœur humain a quatre cavités.", vrai: true, explication: "Deux oreillettes et deux ventricules." },
  { id: "a4", texte: "On voit la Grande Muraille de Chine à l'œil nu depuis la Lune.", vrai: false, explication: "C'est une légende : elle est bien trop étroite, même depuis l'orbite basse on la distingue à peine." },
  { id: "a5", texte: "L'Australie est plus grande que l'Europe.", vrai: false, explication: "Australie : environ 7,7 millions de km² ; Europe : environ 10 millions de km²." },
  { id: "a6", texte: "L'or est plus dense que le plomb.", vrai: true, explication: "Or : 19,3 g/cm³ ; plomb : 11,3 g/cm³." },
  { id: "a7", texte: "Le premier homme a marché sur la Lune en 1971.", vrai: false, explication: "C'était en juillet 1969 (Apollo 11)." },
  { id: "a8", texte: "Le Japon compte plus d'habitants que le Mexique.", vrai: false, explication: "En 2024 : Mexique ≈ 131 millions, Japon ≈ 124 millions (Banque mondiale)." },
  { id: "a9", texte: "Les dauphins sont des poissons.", vrai: false, explication: "Ce sont des mammifères : ils respirent de l'air et allaitent leurs petits." },
  { id: "a10", texte: "Le Rhône prend sa source en Suisse.", vrai: true, explication: "Il naît au glacier du Rhône, en Valais." },
  { id: "a11", texte: "L'eau bout à 100 °C au sommet du Mont Blanc.", vrai: false, explication: "En altitude, la pression est plus basse : l'eau y bout vers 84-85 °C." },
  { id: "a12", texte: "Au handball, chaque équipe a 7 joueurs sur le terrain, gardien compris.", vrai: true, explication: "6 joueurs de champ + 1 gardien." },
  { id: "a13", texte: "Un match de handball adulte dure 2 × 30 minutes.", vrai: true, explication: "Deux mi-temps de 30 minutes." },
  { id: "a14", texte: "Le Sahara est le plus grand désert du monde.", vrai: false, explication: "Le plus grand est l'Antarctique (un désert froid). Le Sahara est le plus grand désert chaud." },
  { id: "a15", texte: "Le Canada compte plus d'habitants que la Californie.", vrai: true, explication: "Canada ≈ 41 millions (2024), Californie ≈ 39 millions : c'est serré !" },
  { id: "a16", texte: "Deux humains ont un ADN identique à plus de 99 %.", vrai: true, explication: "Environ 99,9 % identique." },
  { id: "a17", texte: "Le Vatican est le plus petit État du monde.", vrai: true, explication: "Environ 0,44 km²." },
  { id: "a18", texte: "Le taux normal de TVA en Suisse est de 8,1 % (depuis 2024).", vrai: true, explication: "Il est passé de 7,7 % à 8,1 % au 1er janvier 2024." },
  { id: "a19", texte: "Isaac Newton a vécu avant Galilée.", vrai: false, explication: "Galilée meurt en 1642, l'année où Newton naît." },
  { id: "a20", texte: "L'équateur traverse le Kenya.", vrai: true, explication: "Il passe au centre du pays." },
  { id: "a21", texte: "Les Suissesses ont obtenu le droit de vote au niveau fédéral en 1971.", vrai: true, explication: "Votation du 7 février 1971." },
  { id: "a22", texte: "Le plus long fleuve d'Europe est le Danube.", vrai: false, explication: "C'est la Volga (environ 3 500 km), devant le Danube (environ 2 850 km)." },
  { id: "a23", texte: "Un octet vaut 8 bits.", vrai: true, explication: "1 octet = 8 bits." },
  { id: "a24", texte: "Le PIB de la Suisse est plus grand que celui de la Belgique.", vrai: true, explication: "En 2024, environ 970 milliards $ contre environ 660 milliards $ (Banque mondiale)." },
  { id: "a25", texte: "L'océan Pacifique est plus grand que toutes les terres émergées réunies.", vrai: true, explication: "Pacifique ≈ 165 millions de km² ; terres émergées ≈ 149 millions de km²." },
  { id: "a26", texte: "La tour Eiffel mesure plus de 400 mètres.", vrai: false, explication: "Environ 330 m avec les antennes." },
  { id: "a27", texte: "Napoléon est mort sur l'île de Sainte-Hélène.", vrai: true, explication: "En 1821, en exil." },
  { id: "a28", texte: "La Lune fait le tour de la Terre en environ 27 jours.", vrai: true, explication: "27,3 jours par rapport aux étoiles (29,5 jours d'une pleine lune à la suivante)." },
  { id: "a29", texte: "Le Brésil est le plus grand pays d'Amérique du Sud.", vrai: true, explication: "Environ la moitié du continent." },
  { id: "a30", texte: "Le son va plus vite dans l'air que dans l'eau.", vrai: false, explication: "Environ 340 m/s dans l'air, environ 1 500 m/s dans l'eau." },
  { id: "a31", texte: "Le français est une langue officielle du Canada.", vrai: true, explication: "Avec l'anglais." },
  { id: "a32", texte: "Berne est la plus grande ville de Suisse.", vrai: false, explication: "C'est Zurich. Berne est la « ville fédérale »." },
]

export const NIVEAUX_CONFIANCE = [0.5, 0.6, 0.7, 0.8, 0.9, 1] as const

export const LECONS_PROBA: { titre: string; texte: string; question: string; choix: string[]; bonne: number; explication: string }[] = [
  { titre: "Penser en pourcentages", texte: "Au lieu de « oui » ou « non », dis « j'en suis sûr à 70 % ». Être bien calibré, c'est avoir raison 7 fois sur 10 quand on dit 70 %. Les bons prévisionnistes (météo, paris, finance) s'entraînent à cela.",
    question: "Tu réponds à 10 questions en disant « 90 % sûr » à chaque fois, et tu as juste 6 fois. Tu es…", choix: ["bien calibré", "trop sûr de toi", "pas assez sûr de toi", "impossible à dire"], bonne: 1, explication: "90 % annoncé, 60 % obtenu : tu es trop confiant." },
  { titre: "Le taux de base", texte: "Avant de juger un cas, demande-toi : « en général, à quelle fréquence cela arrive-t-il ? ». C'est le taux de base. On l'oublie souvent parce qu'une histoire frappante attire toute l'attention.",
    question: "Tom est calme et aime les livres. Est-il plutôt bibliothécaire ou commercial ?", choix: ["Bibliothécaire, évidemment", "Commercial est plus probable", "50/50", "On ne peut rien dire"], bonne: 1, explication: "Il y a beaucoup plus de commerciaux que de bibliothécaires : même parmi les gens calmes qui aiment lire, les commerciaux sont plus nombreux." },
  { titre: "Le théorème de Bayes en une phrase", texte: "Une nouvelle preuve doit modifier ton avis, mais en tenant compte de ce que tu savais avant. Exemple : une maladie touche 1 % des gens ; un test la détecte dans 90 % des cas mais se trompe chez 9 % des personnes en bonne santé.",
    question: "Ton test est positif. Quelle est la probabilité d'être vraiment malade ?", choix: ["90 %", "Environ 50 %", "Environ 9 %", "1 %"], bonne: 2, explication: "Sur 1 000 personnes : 10 malades dont 9 positifs, et 990 en bonne santé dont environ 89 positifs. 9 vrais positifs sur 98 positifs ≈ 9 %." },
  { titre: "L'espérance", texte: "Pour choisir, multiplie chaque gain possible par sa probabilité et additionne. C'est l'espérance : ce que tu gagnes en moyenne si tu répètes le choix.",
    question: "Un billet à 2 CHF fait gagner 100 CHF avec une chance sur 100. Que gagnes-tu en moyenne par billet ?", choix: ["+98 CHF", "0 CHF", "−1 CHF", "−2 CHF"], bonne: 2, explication: "Gain moyen : 100 × 1/100 = 1 CHF, moins le prix de 2 CHF = −1 CHF par billet." },
  { titre: "La régression vers la moyenne", texte: "Après une performance exceptionnelle (bonne ou mauvaise), la suivante est souvent plus ordinaire, simplement à cause du hasard. Cela ne prouve pas qu'une méthode marche ou non.",
    question: "Après ton pire match, ton coach te crie dessus, et le match suivant est meilleur. Qu'en conclure ?", choix: ["Crier marche", "Rien de sûr : tu serais sans doute remonté de toute façon", "Il faut crier plus", "Le hasard n'existe pas"], bonne: 1, explication: "Après un résultat extrême, on revient en général vers son niveau habituel, avec ou sans cris." },
]

// ─── Reconnaître la manipulation (cold reading) ───
export const TECHNIQUES: { id: string; nom: string; principe: string; exemple: string; parade: string }[] = [
  { id: "barnum", nom: "Les phrases « Barnum »", principe: "Des affirmations si générales qu'elles conviennent à presque tout le monde, mais qu'on ressent comme personnelles.", exemple: "« Tu peux être très sociable, mais parfois tu as besoin d'être seul. »", parade: "Demande-toi : cette phrase serait-elle fausse pour quelqu'un ? Si non, elle ne dit rien de toi." },
  { id: "peche", nom: "La pêche aux informations", principe: "Poser des questions déguisées en affirmations, puis te faire répéter ce que tu viens de révéler.", exemple: "« Je sens une personne âgée importante pour toi… une grand-mère ? »", parade: "Remarque qui donne vraiment l'information : souvent, c'est toi." },
  { id: "double", nom: "Les affirmations à double sens", principe: "Dire une chose et son contraire en même temps, pour avoir raison dans tous les cas.", exemple: "« Tu es plutôt réservé, même si, avec les bonnes personnes, tu peux être le centre de la fête. »", parade: "Repère les « mais », « même si », « parfois » qui couvrent toutes les possibilités." },
  { id: "indices", nom: "La lecture des indices", principe: "Déduire beaucoup de choses de détails visibles : âge, vêtements, alliance, accent, mains, sac, posture.", exemple: "Un sac de sport et des genoux bandés : « Tu fais un sport qui sollicite beaucoup les articulations. »", parade: "Demande-toi ce que la personne a pu simplement voir ou entendre." },
  { id: "statistique", nom: "Les devinettes statistiques", principe: "Dire des choses fréquentes qui ont de bonnes chances d'être vraies : prénoms courants, cicatrice au genou, boîte de vieilles photos…", exemple: "« Il y a un “J” ou un “M” important dans ta famille. »", parade: "Avec beaucoup de gens, ce genre de phrase « tombe juste » presque toujours." },
  { id: "memoire", nom: "La mémoire sélective", principe: "On retient les phrases justes et on oublie les erreurs. Le manipulateur passe vite sur ses ratés.", exemple: "Sur 20 phrases, 5 justes suffisent à donner l'impression d'un don.", parade: "Compte les ratés autant que les réussites, ou note tout ce qui est dit." },
  { id: "flatterie", nom: "La flatterie et l'émotion", principe: "Dire ce que tu as envie d'entendre ou toucher une émotion forte (deuil, amour, argent) pour baisser ta vigilance.", exemple: "« Tu as un potentiel que les autres n'ont pas encore vu. »", parade: "Plus une phrase te fait plaisir ou te touche, plus il faut la vérifier." },
]

export const EXERCICES_MANIP: { id: string; phrase: string; bonne: string; explication: string }[] = [
  { id: "m1", phrase: "« Tu as parfois des doutes sur tes choix, même si tu sais montrer de l'assurance. »", bonne: "double", explication: "Les deux côtés sont couverts : doute et assurance." },
  { id: "m2", phrase: "« Je vois un chiffre… un 2 ? Une date d'anniversaire, peut-être ? »", bonne: "peche", explication: "C'est une question déguisée : tu vas compléter toi-même." },
  { id: "m3", phrase: "« Tu as un grand besoin d'être apprécié des autres. »", bonne: "barnum", explication: "Presque tout le monde peut s'y reconnaître." },
  { id: "m4", phrase: "À quelqu'un avec une alliance et l'air fatigué : « Je sens des tensions à la maison ces derniers temps. »", bonne: "indices", explication: "Déduction à partir de l'alliance et de la fatigue visibles." },
  { id: "m5", phrase: "« Tu as une cicatrice que peu de gens connaissent. »", bonne: "statistique", explication: "La plupart des gens ont une petite cicatrice quelque part." },
  { id: "m6", phrase: "« Tu as un talent caché que tu n'exploites pas encore. »", bonne: "flatterie", explication: "Agréable à entendre, et invérifiable." },
  { id: "m7", phrase: "Après 15 phrases, la cliente ne se souvient que des 3 qui étaient justes.", bonne: "memoire", explication: "Les erreurs sont oubliées, les réussites retenues." },
  { id: "m8", phrase: "« Quelqu'un de ta famille a eu des soucis de santé, n'est-ce pas ? »", bonne: "peche", explication: "Une question très probable présentée comme une vision." },
]

// ─── Avancement ───
export type EtatEsprit = {
  fermi: Record<string, { estimation: number; date: string }>
  calibration: Record<string, { reponse: boolean; confiance: number }>
  lecons: Record<string, number>
  manipulation: Record<string, string>
}
export const ETAT_ESPRIT_VIDE: EtatEsprit = { fermi: {}, calibration: {}, lecons: {}, manipulation: {} }

const chemin = (uid: string) => `${uid}/esprit/etat.json`
const copie = (uid: string) => `esprit:${uid}`

export async function chargerEsprit(uid: string): Promise<EtatEsprit> {
  const local = relire<EtatEsprit>(copie(uid))
  const { data } = await supabase.storage.from("etudes").download(chemin(uid))
  if (!data) return { ...ETAT_ESPRIT_VIDE, ...(local ?? {}) }
  try { const e = { ...ETAT_ESPRIT_VIDE, ...JSON.parse(await data.text()) }; memoriser(copie(uid), e); return e } catch { return { ...ETAT_ESPRIT_VIDE, ...(local ?? {}) } }
}

export async function enregistrerEsprit(uid: string, e: EtatEsprit): Promise<boolean> {
  memoriser(copie(uid), e)
  const { error } = await supabase.storage.from("etudes").upload(chemin(uid), new Blob([JSON.stringify(e)], { type: "application/json" }), { upsert: true, contentType: "application/json" })
  return !error
}

// Calibration : pour chaque niveau de confiance, part des bonnes réponses ; score de Brier (0 = parfait, 0,25 = pile ou face)
export function bilanCalibration(c: EtatEsprit["calibration"]) {
  const lignes = NIVEAUX_CONFIANCE.map(n => ({ confiance: n, total: 0, justes: 0 }))
  let brier = 0, total = 0
  for (const [id, r] of Object.entries(c)) {
    const a = AFFIRMATIONS.find(x => x.id === id); if (!a) continue
    const juste = r.reponse === a.vrai
    const l = lignes.find(x => x.confiance === r.confiance); if (l) { l.total++; if (juste) l.justes++ }
    brier += (r.confiance - (juste ? 1 : 0)) ** 2; total++
  }
  return { lignes, brier: total ? brier / total : null, total }
}
