// « Projet Graine » : une histoire originale où l'on reconstruit la civilisation
// avec la science, chapitre par chapitre. Chaque chapitre raconte une étape,
// explique la science derrière, puis propose des défis pour débloquer la suite.

export type Matiere = "Chimie" | "Physique" | "Maths" | "Biologie"
export type Defi =
  | { type: "nombre"; question: string; reponse: number; tolerance: number; unite?: string; indice: string; solution: string[] }   // tolérance relative (0.02 = ±2 %)
  | { type: "choix"; question: string; options: string[]; bonne: number; indice: string; solution: string[] }                      // bonne = index dans options
export type Chapitre = {
  id: string; numero: number; titre: string; matieres: Matiere[]; niveau: 1 | 2 | 3 | 4
  recit: string[]                                   // paragraphes de l'histoire (3 à 6)
  science: { titre: string; texte: string[]; formule?: string }[]   // 1 à 3 encadrés
  experience?: string                               // une expérience SANS danger à faire chez soi
  defis: Defi[]                                     // 2 à 4 défis
  securite?: string
  enVrai: string                                    // l'histoire réelle de cette découverte (qui, quand)
  suite: string                                     // phrase de suspense vers le chapitre suivant
}
export type Personnage = { nom: string; role: string; desc: string }

// Présentation générale de l'histoire
export const HISTOIRE: { titre: string; accroche: string; personnages: Personnage[] } = {
  titre: "Projet Graine",
  accroche:
    "Un abri sous le Jura, quatre capsules de sommeil, un carnet abîmé et une intelligence artificielle en panne. Quand Inès et ses amis se réveillent, des siècles ont passé et les forêts ont avalé les villes. Pour redémarrer la civilisation, ils n'ont que leur cerveau, leurs mains et la science. À chaque chapitre, tu essaies de résoudre le problème avant eux !",
  personnages: [
    {
      nom: "Inès Duvoisin",
      role: "Héroïne, 17 ans",
      desc: "Curieuse et douée en maths, elle remarque les détails que les autres ratent. Elle tient le Carnet et aime dire : « Et si on mesurait ? »",
    },
    {
      nom: "Basile Gaillard",
      role: "Le bricoleur",
      desc: "Costaud, pratique et toujours un outil dans la poche. Il transforme les idées d'Inès en objets qui tiennent debout (la plupart du temps).",
    },
    {
      nom: "Lina Chevalley",
      role: "La passionnée de biologie",
      desc: "Elle connaît chaque plante, chaque moisissure et chaque microbe qu'elle ne voit pas encore. Elle veille sur la santé du groupe.",
    },
    {
      nom: "Mathis Perrin",
      role: "Le sceptique",
      desc: "Il répond « Prouve-le » à tout. Agaçant, mais indispensable : grâce à lui, personne ne croit une idée sans l'avoir testée.",
    },
    {
      nom: "Sève",
      role: "L'IA de l'abri (en panne)",
      desc: "Elle devait guider les dormeurs pas à pas. Elle ne ressort que des bribes de phrases, parfois au pire moment. Sa mémoire est peut-être réparable...",
    },
    {
      nom: "Anselme",
      role: "Ancien de la Combe",
      desc: "Un vieux survivant au regard malicieux. Il connaît la forêt mieux que personne, mais ses gens ont perdu presque tous les savoirs d'avant.",
    },
    {
      nom: "Maëlle",
      role: "Guérisseuse de la Combe",
      desc: "Elle soigne avec des herbes et beaucoup de bon sens. Elle pose les questions que les autres n'osent pas poser.",
    },
  ],
}

// Les seize chapitres, du plus simple au plus avancé
export const CHAPITRES: Chapitre[] = [
  // 1. L'eau
  {
    id: "eau",
    numero: 1,
    titre: "De l'eau, vite !",
    matieres: ["Chimie", "Physique"],
    niveau: 1,
    recit: [
      "Un bruit de goutte. Puis un autre. Inès ouvre les yeux sur un plafond de béton fissuré, couvert de mousse. Sa gorge est sèche comme du papier. Autour d'elle, trois autres capsules sont ouvertes, et trois adolescents toussent en se demandant où ils sont.",
      "Sur le mur, un écran clignote : « PROJET GRAINE – RÉVEIL – ANNÉE : ERREUR ». Une voix grésille, celle de Sève, l'intelligence censée les guider : « Bonjour... vous... avez dormi... » Puis plus rien. Sur la dernière capsule, un cahier à la couverture abîmée : le Carnet. Sur la première page, une seule phrase : « Commencez par l'eau. »",
      "Dans la salle des machines, un réservoir de secours est à moitié plein. L'eau est trouble, verdâtre, et sent la terre. Basile y plonge déjà la main, mais Lina l'arrête : « Il y a des milliers d'êtres vivants là-dedans, et pas que des gentils. » Mathis croise les bras : « Tu l'as vu au microscope ? Prouve-le. » — « Je n'ai pas de microscope. Mais j'ai un cerveau. »",
      "Inès remarque que le fond du réservoir est couvert de sable fin. Elle prend un caillou, le lâche : il coule d'un coup. Une brindille, elle, flotte. « Ce n'est pas du hasard, murmure-t-elle. Tout dépend de la densité. » Comment rendre cette eau claire, puis sûre à boire ?",
    ],
    science: [
      {
        titre: "La densité : pourquoi ça coule ou ça flotte",
        texte: [
          "La densité compare la masse d'un objet à son volume. Un kilo de plomb tient dans une petite boîte, un kilo de plumes remplit un sac entier : le plomb est plus dense. L'eau a une densité d'environ 1 g/cm³ (1 gramme par centimètre cube).",
          "Un objet plus dense que l'eau coule, un objet moins dense flotte. C'est pour cela que le sable et les petits cailloux tombent au fond d'une eau trouble : en la laissant reposer, une partie de la saleté se dépose toute seule.",
        ],
        formule: "ρ = m / V",
      },
      {
        titre: "Filtrer n'est pas désinfecter",
        texte: [
          "Un filtre en couches (gravier, sable fin, charbon de bois) retient les particules visibles : feuilles, terre, algues. L'eau devient plus claire et moins sale au goût.",
          "Mais les microbes sont beaucoup trop petits : une bactérie mesure environ un millième de millimètre et peut traverser un filtre simple. Pour les détruire, on utilise la chaleur : à gros bouillons, pendant au moins une minute (trois minutes en haute montagne), l'eau devient bien plus sûre. Ensuite on la laisse refroidir dans un récipient propre.",
        ],
      },
    ],
    experience:
      "Avec un adulte, coupe le fond d'une bouteille en plastique et retourne-la, goulot en bas, au-dessus d'un verre. Remplis-la en couches : un morceau de coton ou de tissu au fond, puis du sable, puis du gravier. Verse de l'eau trouble (un peu de terre mélangée à de l'eau du robinet) et regarde ce qui sort. L'eau est plus claire, mais tu ne dois PAS la boire : elle n'est pas désinfectée.",
    defis: [
      {
        type: "nombre",
        question:
          "Le caillou d'Inès a une masse de 150 g et un volume de 60 cm³. Quelle est sa densité, en g/cm³ ?",
        reponse: 2.5,
        tolerance: 0.02,
        unite: "g/cm³",
        indice: "Densité = masse divisée par volume. Fais attention à garder les mêmes unités.",
        solution: [
          "ρ = m / V",
          "ρ = 150 g / 60 cm³ = 2,5 g/cm³",
          "2,5 est plus grand que 1 (l'eau) : le caillou coule, comme prévu.",
        ],
      },
      {
        type: "choix",
        question: "Pourquoi faut-il faire bouillir l'eau même après l'avoir filtrée ?",
        options: [
          "Pour la rendre plus dense",
          "Pour retirer le sable qui reste",
          "La chaleur détruit la plupart des microbes que le filtre laisse passer",
          "Pour qu'elle change de couleur",
        ],
        bonne: 2,
        indice: "Un microbe est bien plus petit que les trous d'un filtre de sable.",
        solution: [
          "Le filtre arrête les particules visibles, mais pas les bactéries ni les virus.",
          "L'ébullition (au moins une minute) détruit la plupart de ces microbes.",
          "Filtrer rend l'eau claire, bouillir la rend plus sûre : il faut souvent les deux.",
        ],
      },
      {
        type: "nombre",
        question:
          "Le groupe compte 4 personnes qui boivent chacune 2 litres d'eau sûre par jour. De combien de litres a-t-il besoin pour 5 jours ?",
        reponse: 40,
        tolerance: 0.01,
        unite: "L",
        indice: "Multiplie : personnes × litres par jour × nombre de jours.",
        solution: ["Besoin par jour : 4 × 2 L = 8 L", "Pour 5 jours : 8 L × 5 = 40 L"],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : ne bois jamais l'eau d'un filtre fabriqué à la maison, ni l'eau d'une mare ou d'un ruisseau inconnu. Même claire, elle peut te rendre très malade.",
    enVrai:
      "En 1854, à Londres, une épidémie de choléra frappe le quartier de Soho. Le médecin John Snow note chaque cas sur une carte et voit que presque tous les malades boivent à la même pompe, dans Broad Street. Il convainc les autorités de retirer la poignée de la pompe, et l'épidémie recule. C'est l'un des premiers grands exemples où une carte et des calculs sauvent des vies. Quant à la densité, la légende raconte qu'Archimède (Syracuse, IIIe siècle av. J.-C.) l'aurait comprise dans son bain en cherchant à vérifier si une couronne était en or pur.",
    suite:
      "Le soir, l'eau bouillie refroidit dans des bocaux. Mais le froid de la nuit s'infiltre dans l'abri, et Lina remarque que Basile claque des dents. Il faudrait du feu... et personne ne sait comment en faire sans allumettes.",
  },

  // 2. Le feu
  {
    id: "feu",
    numero: 2,
    titre: "Dompter le feu",
    matieres: ["Chimie", "Physique"],
    niveau: 1,
    recit: [
      "La nuit est tombée sur la forêt. Dans la salle de l'abri, le froid mord. Basile a empilé des branches mortes, mais elles refusent de s'allumer. « Il me faut juste une étincelle ! » grogne-t-il en frottant deux morceaux de bois depuis une demi-heure. Ses mains sont rouges, ses branches sont toujours froides.",
      "Inès ouvre le Carnet à la page « Feu ». Quelqu'un a dessiné un triangle, avec trois mots à chaque coin. Mathis lit à voix haute : « Combustible, comburant, chaleur. C'est quoi, ce charabia ? » — « Trois choses qu'il faut en même temps, dit Inès. Si on en retire une seule, le feu s'éteint. »",
      "Lina apporte de l'écorce sèche et de fines brindilles. Elle explique que du bois mouillé ne peut pas brûler : l'eau absorbe d'abord toute la chaleur pour s'évaporer. Il faut commencer petit et sec, puis donner de plus gros morceaux à mesure que les flammes grandissent.",
      "Au bout de quelques minutes, une flamme fragile apparaît. Basile souffle dessus par réflexe et elle grandit. « Pourquoi ça marche ? » demande-t-il, bouche bée. Mathis, pour une fois, n'a pas de « prouve-le » : tout le monde se serre autour de la lueur, soulagé.",
    ],
    science: [
      {
        titre: "Le triangle du feu",
        texte: [
          "Pour qu'un feu existe, il faut trois éléments réunis : un combustible (ce qui brûle : bois, cire, gaz), un comburant (le dioxygène de l'air, qui représente environ 21 % de l'air) et de la chaleur pour démarrer la réaction.",
          "Retire un seul de ces trois éléments et le feu meurt. Couvrir une flamme la prive de dioxygène, l'arroser lui enlève sa chaleur, et retirer le bois lui enlève son combustible. Souffler sur des braises leur apporte du dioxygène frais : elles rougissent.",
        ],
      },
      {
        titre: "Brûler, c'est une réaction chimique qui libère de l'énergie",
        texte: [
          "Quand le bois brûle, le carbone qu'il contient s'associe au dioxygène de l'air et forme du dioxyde de carbone, en libérant de la chaleur et de la lumière. L'énergie était cachée dans le bois : les plantes l'avaient stockée en captant la lumière du Soleil.",
          "Pour chauffer de l'eau, il faut lui fournir de l'énergie. Pour un kilogramme d'eau, il faut environ 4 180 joules pour la réchauffer de 1 °C. Cette valeur s'appelle la capacité thermique massique de l'eau.",
        ],
        formule: "Q = m × c × ΔT   (c = 4 180 J/(kg·°C) pour l'eau)",
      },
    ],
    experience:
      "Avec un adulte, pose une petite bougie chauffe-plat sur une assiette, allume-la, puis recouvre-la d'un grand verre transparent. Observe : la flamme faiblit puis s'éteint toute seule. Le dioxygène du verre s'est épuisé. Soulève le verre, laisse entrer l'air, puis rallume avec l'adulte : tu viens de vérifier le triangle du feu.",
    defis: [
      {
        type: "choix",
        question:
          "Basile pose un couvercle sur une casserole d'huile qui brûle. Quel côté du triangle du feu supprime-t-il ?",
        options: [
          "Le combustible",
          "Le comburant (le dioxygène)",
          "La chaleur",
          "Les trois en même temps",
        ],
        bonne: 1,
        indice: "Que ne peut plus atteindre la flamme quand le couvercle est posé ?",
        solution: [
          "Le couvercle empêche l'air d'arriver à la flamme.",
          "Sans dioxygène (le comburant), la combustion s'arrête.",
          "L'huile est toujours là et encore chaude, mais le feu est éteint.",
        ],
      },
      {
        type: "nombre",
        question:
          "Un feu transmet réellement 1 000 000 J (1 MJ) de chaleur à de l'eau. Combien de kilogrammes d'eau peut-on porter de 20 °C à 100 °C ? (c = 4 180 J/(kg·°C))",
        reponse: 2.99,
        tolerance: 0.03,
        unite: "kg",
        indice: "Isole m dans Q = m × c × ΔT. Commence par calculer ΔT = 100 − 20.",
        solution: [
          "ΔT = 100 − 20 = 80 °C",
          "m = Q / (c × ΔT) = 1 000 000 / (4 180 × 80)",
          "m = 1 000 000 / 334 400 ≈ 2,99 kg, soit environ 3 litres.",
        ],
      },
      {
        type: "choix",
        question: "Pourquoi souffler doucement sur des braises les fait-il rougeoyer ?",
        options: [
          "Parce que le souffle est chaud",
          "Parce qu'il apporte du dioxygène frais",
          "Parce qu'il fait fondre le bois",
          "Parce qu'il enlève le combustible",
        ],
        bonne: 1,
        indice: "Pense au comburant du triangle du feu.",
        solution: [
          "Une braise brûle grâce au dioxygène de l'air autour d'elle.",
          "Souffler renouvelle l'air et apporte plus de dioxygène : la combustion s'accélère.",
          "(Souffler trop fort peut refroidir la braise : il faut doser.)",
        ],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : n'allume jamais un feu seul, ni dans la nature par temps sec, ni avec de l'essence ou des produits inflammables. Pour l'expérience de la bougie, reste avec un adulte et éloigne tout ce qui peut brûler.",
    enVrai:
      "Les humains préhistoriques ont appris à utiliser le feu il y a très longtemps : des traces de foyers ont plus de 400 000 ans, et certaines trouvailles en Afrique du Sud suggèrent des usages encore plus anciens, vers un million d'années. Quant à l'explication chimique, c'est Antoine Lavoisier qui la donne dans les années 1770 : il montre que brûler, c'est se combiner avec un gaz de l'air, qu'il baptise « oxygène ». Avant lui, on pensait qu'un matériau en feu libérait une substance mystérieuse appelée phlogistique.",
    suite:
      "Le feu éclaire un coin de la salle, et Inès voit des griffonnages sur le mur : des lignes, des noms de villes, une étoile entourée. Au-dessus, un mot à moitié effacé : « Jura ». Où sont-ils vraiment ? Et comment le savoir sans carte ni GPS ?",
  },

  // 3. S'orienter
  {
    id: "orientation",
    numero: 3,
    titre: "Où sommes-nous ?",
    matieres: ["Maths", "Physique"],
    niveau: 1,
    recit: [
      "À l'aube, le groupe sort enfin de l'abri. Un souffle d'air frais, des arbres immenses, un silence presque irréel. Des lierres grimpent sur des carcasses de voitures rouillées. Plus aucune route, plus aucun toit visible. « Quelqu'un a une idée de la direction du lac ? » demande Basile.",
      "Inès plante un long bâton bien droit dans la terre plate d'une clairière. « Observez l'ombre. » Mathis soupire : « On perd du temps. » — « On en gagne, justement. » Elle marque d'un caillou le bout de l'ombre. Une demi-heure plus tard, le bout s'est déplacé. Inès le marque encore.",
      "Au fil de la matinée, l'ombre raccourcit, puis s'allonge de nouveau de l'autre côté. Inès relie les cailloux avec une corde. « Quand l'ombre est la plus courte, le Soleil est à son point le plus haut : c'est midi solaire. Et l'ombre pointe alors vers le nord. »",
      "Cette nuit-là, Lina lève les yeux. Le ciel, sans aucune lumière humaine, est un tapis d'étoiles. Inès trouve la Grande Ourse, suit ses deux étoiles du bord et tombe sur une étoile isolée, immobile pendant que les autres tournent. « L'étoile Polaire. Elle nous donne le nord... et bien plus. »",
    ],
    science: [
      {
        titre: "L'ombre, une horloge et une boussole",
        texte: [
          "Le Soleil semble traverser le ciel parce que la Terre tourne sur elle-même : un tour complet de 360° en 24 heures, soit 15° par heure. Un bâton vertical, appelé gnomon, projette une ombre qui tourne comme l'aiguille d'une horloge.",
          "En Suisse (hémisphère nord), à midi solaire, le Soleil est exactement au sud et l'ombre est la plus courte, pointant vers le nord. Marquer le bout de l'ombre plusieurs fois dans la journée suffit pour tracer une ligne nord-sud.",
        ],
        formule: "angle parcouru = 15° × nombre d'heures",
      },
      {
        titre: "L'étoile Polaire et la latitude",
        texte: [
          "L'étoile Polaire est presque exactement dans l'axe de rotation de la Terre : elle semble immobile dans le ciel du nord. Sa hauteur au-dessus de l'horizon est égale à la latitude du lieu où l'on se trouve.",
          "Au pôle Nord, elle est au-dessus de nos têtes (90°) ; à l'équateur, elle est à ras de l'horizon (0°). Le Jura se trouve vers 46,5° de latitude nord : l'étoile y apparaît à 46,5° de hauteur. L'angle entre Polaris et le zénith (le point juste au-dessus de la tête) vaut donc 90° moins la latitude.",
        ],
        formule: "hauteur de Polaris ≈ latitude",
      },
    ],
    experience:
      "Par une journée de soleil, plante un bâton bien vertical dans le sol (ou un crayon dans un morceau de pâte à modeler sur une feuille posée à la fenêtre). Toutes les 30 minutes, marque le bout de l'ombre. Relie les points : tu obtiens la courbe de l'ombre. Le point le plus proche du bâton indique le nord.",
    defis: [
      {
        type: "nombre",
        question:
          "Le Jura est situé à environ 46,5° de latitude nord. Quel angle y a-t-il entre l'étoile Polaire et le zénith (le point juste au-dessus de la tête) ? Réponds en degrés.",
        reponse: 43.5,
        tolerance: 0.01,
        unite: "°",
        indice: "La hauteur de Polaris est égale à la latitude. Le zénith est à 90° de l'horizon.",
        solution: [
          "Hauteur de Polaris au-dessus de l'horizon ≈ 46,5°.",
          "Le zénith est à 90° de l'horizon.",
          "Angle entre Polaris et le zénith = 90 − 46,5 = 43,5°.",
        ],
      },
      {
        type: "nombre",
        question:
          "La Terre tourne de 360° en 24 h. De combien de degrés tourne-t-elle en 1 h 30 min ?",
        reponse: 22.5,
        tolerance: 0.01,
        unite: "°",
        indice: "Calcule d'abord combien de degrés la Terre tourne en une heure.",
        solution: [
          "360° / 24 h = 15° par heure.",
          "1 h 30 min = 1,5 h.",
          "15 × 1,5 = 22,5°.",
        ],
      },
      {
        type: "choix",
        question:
          "En Suisse, quand ton ombre est la plus courte de la journée, vers quel point cardinal pointe-t-elle ?",
        options: ["Le sud", "L'est", "Le nord", "L'ouest"],
        bonne: 2,
        indice: "À midi solaire, où se trouve le Soleil dans le ciel de l'hémisphère nord ?",
        solution: [
          "À midi solaire, le Soleil est exactement au sud.",
          "L'ombre est donc de l'autre côté : elle pointe vers le nord.",
        ],
      },
    ],
    enVrai:
      "Vers 240 av. J.-C., le savant grec Ératosthène, directeur de la bibliothèque d'Alexandrie, compare les ombres au même moment dans deux villes d'Égypte. À Syène, le Soleil éclaire le fond d'un puits : il est à la verticale. À Alexandrie, un bâton projette une ombre qui fait un angle d'environ 7,2° (un cinquantième de cercle). En connaissant la distance entre les deux villes, il en déduit la circonférence de la Terre, avec une erreur de quelques pourcents seulement selon les estimations modernes. Il avait prouvé que la Terre est ronde... avec un bâton.",
    suite:
      "Au retour vers l'abri, Basile s'arrête net. Il a trouvé un grand rectangle de pierres au sol : les murs d'une ancienne maison. « Si on les redresse, on a un toit pour l'hiver ! » Mais comment construire des murs bien droits, sans équerre, sans niveau, sans rien ?",
  },

  // 4. Pythagore
  {
    id: "pythagore",
    numero: 4,
    titre: "Construire droit",
    matieres: ["Maths"],
    niveau: 2,
    recit: [
      "Basile a empilé quelques pierres, mais son mur penche comme une tour de Pise. « Ça a l'air droit ! » proteste-t-il. Mathis le regarde de haut : « L'air, ça ne se mesure pas. » Inès rit : ils ont raison tous les deux, il faut un moyen sûr pour obtenir un angle droit parfait.",
      "Elle sort une longue corde et fait des nœuds à intervalles réguliers. Douze nœuds, douze segments égaux. Elle demande à Lina et à Basile de tenir les bouts. « On forme un triangle avec 3 segments sur un côté, 4 sur un autre et 5 sur le dernier. » Elle tend la corde. Le coin entre les côtés de 3 et de 4 est exactement un angle droit.",
      "Mathis hausse un sourcil : « Prouve-le. » Inès dessine dans la poussière. « Prends un carré de côté 3 : il contient 9 petits carrés. Un carré de côté 4 en contient 16. Et 9 plus 16 font 25, soit un carré de côté 5. C'est ça, la règle. »",
      "En quelques heures, le groupe trace les angles de la future maison. Basile pose un cordeau, vérifie la diagonale, ajuste d'un pas. Les fondations sont impeccables. Mais pour monter les poutres du toit, il va falloir de sérieux muscles... ou de la science.",
    ],
    science: [
      {
        titre: "Le théorème de Pythagore",
        texte: [
          "Dans un triangle qui a un angle droit (un triangle rectangle), le plus grand côté, l'hypoténuse, est en face de l'angle droit. Son carré est égal à la somme des carrés des deux autres côtés.",
          "Cette propriété marche dans les deux sens : si trois longueurs vérifient a² + b² = c², alors le triangle est rectangle. C'est ce qui permet de contrôler un angle droit avec une simple corde.",
        ],
        formule: "a² + b² = c²",
      },
      {
        titre: "Triplets pythagoriciens et aires",
        texte: [
          "Les triplets de nombres entiers qui vérifient la relation sont appelés triplets pythagoriciens : (3, 4, 5), (5, 12, 13), (8, 15, 17)... Il suffit de les multiplier pour en obtenir d'autres : (6, 8, 10) ou (9, 12, 15).",
          "Pour construire, on calcule aussi des aires : pour un rectangle, aire = longueur × largeur, exprimée en m². Cela permet de savoir combien de planches ou de pierres il faut pour un sol.",
        ],
        formule: "aire du rectangle = L × l",
      },
    ],
    experience:
      "Découpe un triangle dans du papier avec les côtés 3 cm, 4 cm et 5 cm. Pose un coin d'une feuille de papier (qui est un angle droit) contre le coin entre les côtés 3 et 4 : ils se superposent exactement. Essaie avec un triangle 3 cm, 4 cm et 6 cm : l'angle n'est plus droit.",
    defis: [
      {
        type: "nombre",
        question:
          "Une fondation rectangulaire mesure 12 m sur 5 m. Basile veut vérifier ses angles droits avec la diagonale. Quelle doit être la longueur de cette diagonale, en mètres ?",
        reponse: 13,
        tolerance: 0.01,
        unite: "m",
        indice: "La diagonale est l'hypoténuse d'un triangle rectangle de côtés 12 et 5.",
        solution: [
          "d² = 12² + 5² = 144 + 25 = 169",
          "d = √169 = 13 m",
          "Si la diagonale mesure 13 m, les angles sont droits. (Le triplet 5-12-13 !)",
        ],
      },
      {
        type: "nombre",
        question:
          "Le plancher de la future cabane est un rectangle de 4,5 m sur 3,2 m. Quelle est son aire, en m² ?",
        reponse: 14.4,
        tolerance: 0.01,
        unite: "m²",
        indice: "Aire d'un rectangle = longueur × largeur.",
        solution: ["Aire = 4,5 × 3,2", "4,5 × 3 = 13,5 et 4,5 × 0,2 = 0,9", "Aire = 13,5 + 0,9 = 14,4 m²"],
      },
      {
        type: "choix",
        question: "Lequel de ces trois triplets de longueurs forme un triangle rectangle ?",
        options: ["6 ; 7 ; 9", "4 ; 5 ; 7", "5 ; 12 ; 13", "7 ; 8 ; 10"],
        bonne: 2,
        indice: "Teste a² + b² = c² avec le plus grand nombre comme c.",
        solution: [
          "5² + 12² = 25 + 144 = 169 = 13² : c'est un triangle rectangle.",
          "6² + 7² = 85 ≠ 81 ; 4² + 5² = 41 ≠ 49 ; 7² + 8² = 113 ≠ 100.",
        ],
      },
      {
        type: "nombre",
        question:
          "Une échelle de 5 m est posée contre un mur vertical, son pied à 3 m du mur. À quelle hauteur touche-t-elle le mur, en mètres ?",
        reponse: 4,
        tolerance: 0.01,
        unite: "m",
        indice: "L'échelle est l'hypoténuse. Cherche l'autre côté de l'angle droit.",
        solution: ["h² + 3² = 5²", "h² = 25 − 9 = 16", "h = √16 = 4 m"],
      },
    ],
    enVrai:
      "On attribue le théorème au philosophe grec Pythagore (VIe siècle av. J.-C.), mais la relation était connue bien avant lui : une tablette d'argile babylonienne appelée Plimpton 322, vieille d'environ 3 800 ans, liste des triplets pythagoriciens. On raconte aussi que les arpenteurs de l'Égypte ancienne utilisaient des cordes à nœuds pour retrouver les angles droits des champs après les crues du Nil. Une idée simple, utilisée pendant des millénaires.",
    suite:
      "Les murs sont posés, mais les poutres du toit pèsent une tonne. À mains nues, impossible de les hisser. Anselme, un vieil homme qui observait de loin depuis le début, sort enfin des buissons : « Vous avez une belle idée pour les angles. Mais pour lever ça... vous avez un truc ? »",
  },

  // 5. Levier et poulies
  {
    id: "levier",
    numero: 5,
    titre: "Soulever le monde",
    matieres: ["Physique"],
    niveau: 2,
    recit: [
      "Anselme les observe en mâchonnant un brin d'herbe. Il vit avec une petite communauté, la Combe, à deux jours de marche. Depuis des années, ils survivent, mais ils ont oublié presque tout ce que les gens savaient avant. Il est fasciné par les cordes à nœuds d'Inès, et par le Carnet.",
      "Basile tire sur la plus grosse poutre : rien ne bouge. Quatre adolescents poussent ensemble : à peine un frémissement. Anselme pouffe. Inès réfléchit à voix haute : « On ne pourra pas avoir plus de force qu'on n'en a. Mais on peut la transformer. »",
      "Elle glisse un tronc robuste sous la poutre, près du bout, et le pose sur une grosse pierre. Basile appuie à l'autre extrémité du tronc : la poutre se soulève ! Mathis n'en revient pas. « Plus on appuie loin du pivot, moins on a besoin de force. Mais il faut descendre plus bas pour monter le poids d'un petit peu. »",
      "Pour hisser la poutre sur le mur, Basile fixe une corde à une branche de chêne et à la poutre, puis enroule la corde plusieurs fois autour de poulies en bois taillées à la va-vite. Il tire, tire, tire, et la lourde poutre monte lentement. « Ça demande moins d'effort, mais je dois tirer beaucoup plus de corde ! »",
    ],
    science: [
      {
        titre: "Le levier et les moments",
        texte: [
          "Un levier est une barre qui tourne autour d'un point fixe, le pivot. Chaque force qui s'applique sur la barre tend à la faire tourner : on mesure cet effet par le moment, égal à la force multipliée par la distance au pivot.",
          "Le levier est en équilibre quand le moment d'un côté est égal au moment de l'autre. Pour soulever une charge lourde proche du pivot, il suffit d'une petite force loin du pivot.",
        ],
        formule: "F₁ × d₁ = F₂ × d₂",
      },
      {
        titre: "Le travail : on ne gagne jamais sur tout",
        texte: [
          "En physique, le travail d'une force est la force multipliée par la distance parcourue dans sa direction. Pour soulever un objet de masse m à une hauteur h, il faut fournir un travail W = m × g × h, avec g = 9,81 m/s² (l'intensité de la pesanteur sur Terre), en joules (J).",
          "Un levier ou un palan permet de diviser la force, mais le travail reste le même : ce qu'on gagne en force, on le perd en distance. Un palan à 4 brins divise la force par 4... mais il faut tirer 4 fois plus de corde.",
        ],
        formule: "W = m × g × h",
      },
    ],
    experience:
      "Pose une règle de 30 cm en équilibre sur un crayon (le pivot) placé à son milieu. Mets 2 pièces identiques à 10 cm du crayon d'un côté. Essaie de les équilibrer avec 1 seule pièce de l'autre côté : tu verras qu'il faut la poser à 20 cm du pivot. Tu viens de vérifier F₁ × d₁ = F₂ × d₂.",
    defis: [
      {
        type: "nombre",
        question:
          "Une poutre exerce un poids de 600 N à 0,5 m du pivot. Basile appuie à 2,5 m du pivot, de l'autre côté. Quelle force doit-il exercer pour équilibrer la poutre, en newtons ?",
        reponse: 120,
        tolerance: 0.01,
        unite: "N",
        indice: "Écris l'égalité des moments : 600 × 0,5 = F × 2,5.",
        solution: [
          "Moment de la charge : 600 × 0,5 = 300 N·m",
          "À l'équilibre : F × 2,5 = 300",
          "F = 300 / 2,5 = 120 N, soit cinq fois moins que le poids de la poutre.",
        ],
      },
      {
        type: "nombre",
        question:
          "Quel travail faut-il fournir pour hisser une poutre de 40 kg à 3 m de hauteur ? (g = 9,81 m/s²) Réponds en joules.",
        reponse: 1177.2,
        tolerance: 0.01,
        unite: "J",
        indice: "W = m × g × h. Pas besoin de tenir compte du levier : le travail ne change pas.",
        solution: ["W = m × g × h", "W = 40 × 9,81 × 3", "W = 392,4 × 3 = 1 177,2 J"],
      },
      {
        type: "nombre",
        question:
          "Avec un palan à 4 brins, on divise la force par 4. Si la poutre doit monter de 2 m, combien de mètres de corde faut-il tirer ?",
        reponse: 8,
        tolerance: 0.01,
        unite: "m",
        indice: "Le travail est le même : si la force est divisée par 4, la distance est multipliée par...",
        solution: [
          "Travail identique : F × d reste constant.",
          "Force ÷ 4 donc distance × 4.",
          "Corde tirée = 4 × 2 m = 8 m.",
        ],
      },
      {
        type: "choix",
        question: "Un levier permet de soulever une lourde pierre avec peu de force. Qu'est-ce qu'on y perd ?",
        options: [
          "Rien du tout, c'est gratuit",
          "Beaucoup de distance à parcourir avec la main",
          "De la masse de la pierre",
          "De la pesanteur",
        ],
        bonne: 1,
        indice: "Quand on appuie loin du pivot, de combien la main descend-elle par rapport à la pierre qui monte ?",
        solution: [
          "On diminue la force, mais le travail W = F × d reste le même.",
          "Si F est plus petite, d est plus grande : la main parcourt une longue distance pour que la pierre monte un peu.",
        ],
      },
    ],
    enVrai:
      "Archimède de Syracuse (IIIe siècle av. J.-C.) a expliqué la loi du levier avec des raisonnements mathématiques. On lui attribue la phrase « Donnez-moi un point d'appui et je soulèverai le monde », rapportée plusieurs siècles plus tard par Pappus d'Alexandrie. Les mêmes principes ont permis de bâtir les pyramides, les cathédrales et les grues des chantiers. Les palans à poulies, eux, étaient déjà utilisés par les Grecs et les Romains pour hisser des charges.",
    suite:
      "Le toit est monté ! Mais sur le chantier, Basile compte les arbres autour : pour la prochaine charpente, il faudra des troncs d'au moins vingt mètres. Impossible de grimper pour les mesurer. Comment connaître la hauteur d'un arbre quand on reste au sol ?",
  },

  // 6. Hauteur d'un arbre
  {
    id: "arbre",
    numero: 6,
    titre: "Mesurer sans toucher",
    matieres: ["Maths"],
    niveau: 2,
    recit: [
      "Dans la clairière, Basile fait face à un hêtre gigantesque. « Celui-là ferait une poutre magnifique, mais je ne sais même pas s'il est assez long. » Mathis lève la tête : « On monte avec une corde et on laisse tomber un fil, comme les marins. » Lina secoue la tête : « Personne ne grimpe sur un arbre de vingt mètres sans harnais. »",
      "Inès cherche un bâton de la taille de son bras, lui trouve 1,5 mètre, et le plante droit dans la terre. L'ombre du bâton mesure 2 mètres. Elle marche jusqu'à l'ombre de l'arbre, pas après pas. « Vingt-quatre mètres. » Elle sourit. « C'est tout ce qu'il nous faut. »",
      "Elle dessine dans la terre deux triangles : l'un avec le bâton et son ombre, l'autre avec l'arbre et son ombre. « Le Soleil éclaire les deux avec le même angle. Donc ces triangles ont la même forme, l'un est juste un agrandissement de l'autre. » Elle fait un calcul rapide et annonce la hauteur de l'arbre. Mathis refuse de la croire.",
      "Alors Inès prend un autre moyen : elle vise le sommet de l'arbre avec une planche en bois sur laquelle elle a marqué des angles. À 30 mètres, elle lit une valeur d'angle, la compare à une table de proportions du Carnet, et retrouve presque le même résultat. « Deux méthodes, un seul arbre : prouvé ! »",
      "Au loin, une colonne de fumée monte du côté du lac. Personne d'autre que la Combe ne devrait vivre ici. Ou alors... d'autres survivants ?",
    ],
    science: [
      {
        titre: "Les triangles semblables",
        texte: [
          "Deux triangles sont semblables s'ils ont les mêmes angles : l'un est un agrandissement ou une réduction de l'autre. Leurs côtés sont alors proportionnels : le rapport entre deux côtés correspondants est toujours le même.",
          "Au même instant, le Soleil éclaire tous les objets avec la même inclinaison. Un bâton et un arbre forment donc deux triangles semblables avec leurs ombres : hauteur de l'arbre / ombre de l'arbre = hauteur du bâton / ombre du bâton.",
        ],
        formule: "H / ombre(H) = h / ombre(h)",
      },
      {
        titre: "La tangente : la pente d'un angle",
        texte: [
          "Dans un triangle rectangle, la tangente d'un angle est le rapport entre le côté opposé à l'angle et le côté adjacent. Elle mesure la « pente » de la ligne de visée.",
          "Si tu te places à une distance d de l'arbre et que tu mesures l'angle α entre l'horizontale et le sommet, la hauteur au-dessus de tes yeux vaut d × tan(α). N'oublie pas d'ajouter la hauteur de tes yeux par rapport au sol !",
        ],
        formule: "tan(α) = opposé / adjacent",
      },
    ],
    experience:
      "Par temps de soleil, mesure l'ombre d'un poteau, d'un lampadaire ou d'un arbre de ton jardin, puis l'ombre d'un bâton de 1 m planté droit à côté. Calcule la hauteur du poteau avec la proportionnalité. Tu peux vérifier en demandant à quelqu'un de mesurer le poteau avec un mètre de couturière sur un balcon.",
    defis: [
      {
        type: "nombre",
        question:
          "Un bâton vertical de 1,5 m projette une ombre de 2 m. Au même moment, l'ombre du hêtre mesure 24 m. Quelle est la hauteur du hêtre, en mètres ?",
        reponse: 18,
        tolerance: 0.02,
        unite: "m",
        indice: "Calcule d'abord le rapport hauteur / ombre du bâton.",
        solution: [
          "Rapport du bâton : 1,5 / 2 = 0,75 (la hauteur vaut 0,75 fois l'ombre).",
          "Le même rapport s'applique à l'arbre : H = 0,75 × 24",
          "H = 18 m",
        ],
      },
      {
        type: "nombre",
        question:
          "Inès se tient à 30 m du pied d'un autre arbre. Ses yeux sont à 1,6 m du sol et elle vise le sommet sous un angle de 35° au-dessus de l'horizontale. Quelle est la hauteur de l'arbre ? (tan 35° ≈ 0,7002) Arrondis au mètre près si tu veux.",
        reponse: 22.6,
        tolerance: 0.03,
        unite: "m",
        indice: "Hauteur au-dessus des yeux = distance × tan(angle). Ajoute ensuite la hauteur des yeux.",
        solution: [
          "Hauteur au-dessus des yeux = 30 × tan 35° = 30 × 0,7002 ≈ 21,0 m",
          "Ajout de la hauteur des yeux : 21,0 + 1,6 = 22,6 m",
        ],
      },
      {
        type: "choix",
        question:
          "Inès vise le sommet d'un arbre sous un angle de 45° à une distance de 20 m. Que peux-tu dire de la hauteur de l'arbre au-dessus de ses yeux ?",
        options: [
          "Elle est deux fois plus petite que 20 m",
          "Elle est égale à 20 m",
          "Elle est deux fois plus grande que 20 m",
          "On ne peut pas savoir",
        ],
        bonne: 1,
        indice: "Que vaut tan 45° ?",
        solution: [
          "tan 45° = 1 : le côté opposé est égal au côté adjacent.",
          "La hauteur au-dessus des yeux est donc égale à la distance : 20 m.",
        ],
      },
    ],
    enVrai:
      "On raconte que le philosophe grec Thalès de Milet (VIe siècle av. J.-C.) a mesuré la hauteur d'une pyramide d'Égypte en comparant son ombre à celle d'un bâton, exactement comme Inès. Quant à la trigonométrie, elle s'est développée dans l'Antiquité grecque (Hipparque, IIe siècle av. J.-C.), puis chez les astronomes de l'Inde et du monde arabe, qui ont dressé des tables d'angles pour calculer des distances et naviguer.",
    suite:
      "Le lendemain, la fumée est plus proche. Six personnes surgissent de la forêt avec des outils de pierre et des yeux fatigués. À leur tête, une femme au regard franc : Maëlle. Elle propose un marché : de l'aide pour les murs... contre le secret d'une pierre étrange qu'on fait chauffer pour obtenir une poudre blanche.",
  },

  // 7. Chaux et mortier
  {
    id: "chaux",
    numero: 7,
    titre: "La pierre qui devient poudre",
    matieres: ["Chimie"],
    niveau: 3,
    recit: [
      "Maëlle et les siens s'installent près du chantier. Ils ont eux aussi des histoires de survie, mais peu de savoir-faire. Ils connaissent pourtant un secret transmis de génération en génération : une pierre grise, quand on la chauffe très longtemps dans un grand fourneau, devient une poudre blanche qui change tout.",
      "« Et alors ? » demande Mathis. Maëlle sourit. « Alors on la mélange à de l'eau et à du sable, et ça colle les pierres entre elles. Mais personne ne sait pourquoi ça marche. » Inès prend le Carnet et cherche la page « Calcaire ». Il y a une équation, une petite flèche, et la mention : « le gaz s'échappe ».",
      "Lina propose une expérience de comparaison : elle pèse un morceau de calcaire avant, un autre de la même pierre après chauffage (par les gens de la Combe). Le morceau chauffé est nettement plus léger. « La pierre a perdu de la masse ! Où est-elle partie ? » Inès devine : « Dans l'air, sous forme de gaz invisible. »",
      "Au fil des jours, le mortier prend. Les murs de la maison tiennent mieux que jamais. Mais un soir, un cri retentit : un enfant de la Combe s'est frotté la peau avec de la poudre blanche mouillée et pleure de douleur. Maëlle se précipite avec de l'eau claire. « Cette poudre brûle, comprend Inès. Elle est dangereuse tant qu'on ne sait pas la manipuler. »",
    ],
    science: [
      {
        titre: "La calcination du calcaire",
        texte: [
          "Le calcaire est surtout formé de carbonate de calcium (CaCO₃). Chauffé très fort, il se décompose : il donne de la chaux vive (oxyde de calcium, CaO) et un gaz, le dioxyde de carbone (CO₂), qui s'échappe dans l'air.",
          "C'est pour cela que la pierre devient plus légère. Rien ne disparaît pourtant : la masse de départ est égale à la masse des produits. Les masses molaires aident à compter : M(Ca) = 40 g/mol, M(C) = 12 g/mol, M(O) = 16 g/mol. Donc M(CaCO₃) = 100 g/mol, M(CaO) = 56 g/mol et M(CO₂) = 44 g/mol.",
        ],
        formule: "CaCO₃ → CaO + CO₂",
      },
      {
        titre: "Pourquoi le mortier durcit",
        texte: [
          "La chaux vive réagit avec l'eau pour donner de la chaux éteinte (hydroxyde de calcium, Ca(OH)₂) : c'est la pâte qu'on mélange au sable. Ensuite, la pâte durcit lentement, parce qu'elle absorbe le CO₂ de l'air et redevient du carbonate de calcium, donc de la pierre.",
          "Le mortier ne durcit donc pas seulement en séchant. Il retransforme peu à peu la poudre en calcaire. Le cycle est complet : la pierre devient poudre, puis la poudre redevient pierre.",
        ],
        formule: "Ca(OH)₂ + CO₂ → CaCO₃ + H₂O",
      },
    ],
    experience:
      "Plonge une coquille d'œuf (faite de calcaire) dans un verre de vinaigre blanc. Des bulles apparaissent : c'est du dioxyde de carbone qui s'échappe, signe que le carbonate de calcium réagit avec un acide. Laisse reposer plusieurs heures : la coquille devient molle. Rince-la ensuite à l'eau.",
    defis: [
      {
        type: "nombre",
        question:
          "On chauffe 500 g de calcaire pur (CaCO₃). Quelle masse maximale de chaux vive (CaO) obtient-on, en grammes ? (M(CaCO₃) = 100 g/mol ; M(CaO) = 56 g/mol ; 1 mol de CaCO₃ donne 1 mol de CaO)",
        reponse: 280,
        tolerance: 0.01,
        unite: "g",
        indice: "Calcule d'abord la quantité de matière de CaCO₃ : n = m / M.",
        solution: [
          "n(CaCO₃) = 500 / 100 = 5 mol",
          "La réaction donne 1 mol de CaO pour 1 mol de CaCO₃ : n(CaO) = 5 mol",
          "m(CaO) = n × M = 5 × 56 = 280 g",
        ],
      },
      {
        type: "nombre",
        question:
          "Lors de la calcination, le calcaire pur perd 44 g de CO₂ pour 100 g de départ, soit 44 % de sa masse. Un bloc pur de 2,5 kg est chauffé : quelle masse de gaz s'échappe, en kg ?",
        reponse: 1.1,
        tolerance: 0.01,
        unite: "kg",
        indice: "Prends 44 % de la masse de départ.",
        solution: ["Masse perdue = 44 % de 2,5 kg", "0,44 × 2,5 = 1,1 kg de CO₂"],
      },
      {
        type: "choix",
        question: "Pourquoi un mortier à la chaux devient-il dur avec le temps ?",
        options: [
          "Il absorbe peu à peu du CO₂ de l'air et redevient du carbonate de calcium",
          "Il gèle à cause du froid",
          "Il perd tout son calcium",
          "Il se transforme en fer",
        ],
        bonne: 0,
        indice: "Pense à la réaction inverse de la calcination.",
        solution: [
          "La chaux éteinte Ca(OH)₂ réagit avec le CO₂ présent dans l'air.",
          "Elle redevient du carbonate de calcium CaCO₃, une matière dure comme la pierre.",
          "L'eau libérée s'évapore.",
        ],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : la chaux vive et la chaux éteinte sont caustiques (elles brûlent la peau et les yeux) et le four à chaux est dangereux. Ne cherche jamais à en fabriquer ni à en manipuler. Pour l'expérience, utilise seulement du vinaigre et une coquille d'œuf.",
    enVrai:
      "L'être humain utilise la chaux depuis des millénaires. Les Romains ont perfectionné leur béton (le « opus caementicium ») avec de la chaux et des cendres volcaniques. Le dôme du Panthéon de Rome, construit vers 125 apr. J.-C., est toujours debout et reste la plus grande coupole en béton non armé du monde. Plus tard, Antoine Lavoisier (1789) a énoncé la conservation de la masse : « rien ne se perd, rien ne se crée, tout se transforme ».",
    suite:
      "Les mains de l'enfant brûlé guérissent, mais Lina fronce les sourcils : la peau des gens de la Combe est couverte de petites plaies, faute de moyen de se laver correctement. Maëlle avoue qu'elle a déjà vu des savons autrefois, sans jamais comprendre comment les refaire.",
  },

  // 8. Savon
  {
    id: "savon",
    numero: 8,
    titre: "Le secret du savon",
    matieres: ["Chimie"],
    niveau: 3,
    recit: [
      "Lina examine les mains de Maëlle. Des crevasses, de la crasse incrustée, des plaies qui s'infectent. « Vous vous lavez à l'eau ? » — « Bien sûr, tous les jours. » — « Mais l'eau seule ne suffit pas. Regardez. » Elle plonge un doigt graisseux dans un bol d'eau claire : la graisse flotte en petites perles et refuse de partir.",
      "Dans le Carnet, une page raconte : « Le savon est une molécule à deux visages. D'un côté, elle aime l'eau. De l'autre, elle aime la graisse. » Mathis se penche : « Une molécule qui aime les deux ? » Inès hoche la tête : « C'est comme un médiateur entre deux ennemis qui refusent de se parler. »",
      "Dans la clairière, Inès dessine un schéma dans la terre : une tête ronde reliée à une longue queue. Les queues s'enfoncent dans la goutte de graisse, les têtes restent tournées vers l'eau. La graisse se retrouve emballée dans des petites boules, que l'eau peut emporter au loin.",
      "Anselme demande comment on fabrique le savon. Le Carnet répond par un seul mot, entouré de rouge : « DANGER ». Il explique qu'il faut une substance très agressive pour la peau. Le groupe décide d'abord de comprendre la science, et seulement ensuite, de chercher une façon sûre de le faire plus tard, avec des adultes expérimentés.",
    ],
    science: [
      {
        titre: "La molécule de savon : une tête et une queue",
        texte: [
          "Une molécule de savon a une « tête » hydrophile (qui aime l'eau) et une « queue » hydrophobe (qui fuit l'eau mais s'accroche à la graisse). Dans l'eau savonneuse, les queues entourent les gouttes de graisse, les têtes restent tournées vers l'eau : la graisse est emportée au rinçage.",
          "Le savon se forme par une réaction appelée saponification : une graisse réagit avec une base forte pour donner du savon et de la glycérine. Cette réaction utilise des produits dangereux, c'est pourquoi on ne la tente pas sans formation.",
        ],
      },
      {
        titre: "L'échelle du pH",
        texte: [
          "Le pH mesure l'acidité d'une solution. L'eau pure est neutre (pH 7). En dessous de 7 on est acide (citron, vinaigre), au-dessus de 7 on est basique (savon, bicarbonate).",
          "L'échelle est logarithmique : chaque unité de pH correspond à une concentration en ions H₃O⁺ divisée ou multipliée par 10. Un pH de 5 est donc 100 fois plus acide qu'un pH de 7. Le lien est : pH = −log [H₃O⁺], avec [H₃O⁺] en mol/L.",
        ],
        formule: "pH = −log [H₃O⁺]",
      },
    ],
    experience:
      "Remplis une assiette d'eau et saupoudre du poivre à la surface. Trempe un doigt propre dans le liquide vaisselle, puis touche le centre de l'eau : le poivre s'enfuit vers les bords. Le savon casse la « peau » de la surface de l'eau (la tension superficielle). Essaie aussi de mélanger de l'huile et de l'eau dans un bocal, avec puis sans une goutte de liquide vaisselle.",
    defis: [
      {
        type: "nombre",
        question:
          "Le jus de citron a un pH de 2 et l'eau pure un pH de 7. Combien de fois la concentration en ions H₃O⁺ est-elle plus grande dans le jus de citron ?",
        reponse: 100000,
        tolerance: 0.01,
        indice: "Chaque unité de pH correspond à un facteur 10. Combien d'unités d'écart ?",
        solution: [
          "Écart de pH : 7 − 2 = 5",
          "Chaque unité vaut un facteur 10, donc 10⁵",
          "10⁵ = 100 000 fois plus d'ions H₃O⁺.",
        ],
      },
      {
        type: "nombre",
        question:
          "Dans une eau savonneuse, la concentration en ions H₃O⁺ est de 1 × 10⁻¹⁰ mol/L. Quel est son pH ?",
        reponse: 10,
        tolerance: 0.01,
        indice: "pH = −log [H₃O⁺]. Que vaut log de 10⁻¹⁰ ?",
        solution: ["pH = −log(10⁻¹⁰)", "log(10⁻¹⁰) = −10", "pH = 10 : la solution est basique."],
      },
      {
        type: "choix",
        question: "Pourquoi le savon enlève-t-il la graisse alors que l'eau seule n'y arrive pas ?",
        options: [
          "Le savon chauffe l'eau",
          "Le savon fait fondre la graisse",
          "Ses molécules s'accrochent à la graisse d'un côté et à l'eau de l'autre",
          "Le savon transforme la graisse en eau",
        ],
        bonne: 2,
        indice: "Pense à la molécule avec une tête et une queue.",
        solution: [
          "La queue hydrophobe s'accroche à la graisse, la tête hydrophile reste dans l'eau.",
          "La graisse est découpée en petites gouttes que l'eau peut emporter.",
        ],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : la fabrication du savon utilise une base forte (soude) qui provoque de graves brûlures de la peau et des yeux, et dégage des vapeurs irritantes. Ne tente jamais de la préparer ni de la manipuler. Ton expérience au poivre est sans risque.",
    enVrai:
      "Les plus anciennes traces de savon connues datent d'environ 2800 av. J.-C. à Babylone (en Mésopotamie), sur des tablettes d'argile qui décrivent un mélange de graisse et de cendres. Le célèbre savon de Marseille a été encadré par un édit de Louis XIV en 1688, qui fixait les règles de fabrication. Au XIXe siècle, le chimiste français Michel-Eugène Chevreul (1823) montre que les graisses sont formées d'acides gras et de glycérine, ce qui explique enfin la saponification.",
    suite:
      "Au repas, Maëlle sort un pain plat et dur, qu'on mange avec dégoût. « Autrefois, il paraît que le pain gonflait, léger comme un nuage. » Lina se redresse : elle a une idée sur ce qui manque. Quelque chose de vivant, de minuscule... et qui adore le sucre.",
  },

  // 9. Fermentation
  {
    id: "fermentation",
    numero: 9,
    titre: "Les petits qui font gonfler",
    matieres: ["Biologie", "Maths"],
    niveau: 3,
    recit: [
      "Lina a mélangé de la farine, de l'eau tiède et un peu de jus de fruit sucré dans un bol qu'elle a posé près du feu. Au matin, la pâte a changé : elle est pleine de petites bulles, et elle sent légèrement l'acide. « Quelqu'un a mis du gaz dedans ? » demande Basile.",
      "Mathis reste sceptique. « Des bulles, il y en a dans l'eau qui bout. » Lina soulève un voile de tissu sur le bol : « Sauf que là, il n'y a aucune chaleur excessive. Ce sont des êtres vivants, des levures. Elles mangent le sucre de la farine et rejettent du gaz. »",
      "Inès note dans le Carnet : « Au départ, 1 000 cellules. Elles se divisent en deux toutes les 90 minutes. » Elle fronce les sourcils. « Si le nombre double, puis double encore, puis encore... le total grandit de plus en plus vite. » Elle trace un graphique : une courbe qui décolle comme une fusée.",
      "Le lendemain, la pâte a doublé de volume. Elle est cuite sur une pierre plate chauffée. Le pain gonfle, devient tendre et chaud. Les gens de la Combe l'avalent en silence. Anselme pleure presque. Mais Lina plisse les yeux : le même bol laissé trop longtemps sent mauvais.",
    ],
    science: [
      {
        titre: "Les levures et la fermentation",
        texte: [
          "Les levures sont des champignons microscopiques formés d'une seule cellule. En l'absence d'air, elles transforment le sucre en éthanol (l'alcool) et en dioxyde de carbone. C'est la fermentation alcoolique.",
          "Dans la pâte à pain, c'est le gaz (CO₂) qui forme des bulles et fait gonfler la pâte. Pendant la cuisson, l'alcool s'évapore. La levure meurt à la chaleur, mais la mie reste alvéolée.",
        ],
        formule: "sucre → éthanol + CO₂ (+ un peu d'énergie)",
      },
      {
        titre: "La croissance exponentielle",
        texte: [
          "Quand une population double à intervalles réguliers, on parle de croissance exponentielle. Si N₀ est le nombre de départ et n le nombre de doublements, alors N = N₀ × 2ⁿ.",
          "Au début, la croissance semble lente, puis elle explose. Dans la nature, elle s'arrête quand la nourriture manque ou que les déchets s'accumulent. Pour trouver n quand on connaît le facteur de multiplication F, on utilise le logarithme en base 2 : n = log₂(F).",
        ],
        formule: "N = N₀ × 2ⁿ",
      },
    ],
    experience:
      "Dans une petite bouteille en plastique, mélange 1 cuillère à café de sucre, 1 cuillère à café de levure de boulanger et un peu d'eau TIÈDE (pas chaude). Fixe un ballon sur le goulot. Pose la bouteille dans un endroit tiède pendant une heure : le ballon se gonfle tout seul, grâce au CO₂ produit par les levures.",
    defis: [
      {
        type: "nombre",
        question:
          "Une pâte contient au départ 1 000 cellules de levure. Elles doublent toutes les 90 minutes. Combien de cellules après 9 heures ?",
        reponse: 64000,
        tolerance: 0.01,
        indice: "Combien de doublements en 9 h ? Utilise N = N₀ × 2ⁿ.",
        solution: [
          "9 h = 540 min ; 540 / 90 = 6 doublements.",
          "N = 1 000 × 2⁶ = 1 000 × 64",
          "N = 64 000 cellules.",
        ],
      },
      {
        type: "nombre",
        question:
          "Combien de doublements (nombre réel) faut-il pour passer de 1 000 à 1 000 000 de cellules ? (log₂ 1 000 ≈ 9,97)",
        reponse: 9.97,
        tolerance: 0.02,
        indice: "Le facteur de multiplication est 1 000 000 / 1 000. Cherche n tel que 2ⁿ = ce facteur.",
        solution: [
          "Facteur de multiplication : 1 000 000 / 1 000 = 1 000",
          "On cherche n tel que 2ⁿ = 1 000.",
          "Comme 2¹⁰ = 1 024, n est un peu inférieur à 10 : n = log₂(1 000) ≈ 9,97.",
        ],
      },
      {
        type: "choix",
        question: "D'où viennent les bulles qui font gonfler la pâte à pain ?",
        options: [
          "De l'eau qui bout",
          "Du dioxyde de carbone produit par les levures",
          "De l'oxygène que les levures fabriquent à partir de rien",
          "De l'air que le boulanger a soufflé dedans",
        ],
        bonne: 1,
        indice: "Les levures mangent du sucre. Que rejettent-elles ?",
        solution: [
          "Les levures transforment le sucre en éthanol et en CO₂.",
          "Le CO₂, un gaz, forme des bulles dans la pâte et la fait gonfler.",
        ],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : ne goûte pas et ne bois pas une préparation qui a fermenté sans contrôle, elle peut contenir des moisissures ou des microbes dangereux. Ton expérience de la bouteille et du ballon est sans risque : ne la goûte pas non plus.",
    enVrai:
      "Les Égyptiens fabriquaient du pain levé et de la bière il y a plus de 4 000 ans, sans savoir pourquoi ça marchait. Ce n'est qu'en 1857-1860 que Louis Pasteur démontre que la fermentation est causée par des êtres vivants microscopiques, les levures, et non par une simple réaction chimique spontanée. Cette découverte a ouvert la voie à la microbiologie moderne.",
    suite:
      "Anselme sort de sa poche un petit objet rond et transparent, qu'il garde depuis des années : un morceau de verre épais. Quand il le place devant un texte du Carnet, les lettres grossissent. « Ça vient d'avant, dit-il. Mais personne ne sait comment l'obtenir. »",
  },

  // 10. Verre et lentilles
  {
    id: "lentilles",
    numero: 10,
    titre: "Plier la lumière",
    matieres: ["Physique"],
    niveau: 3,
    recit: [
      "Le morceau de verre d'Anselme fait grossir les mots du Carnet. Maëlle ne le quitte plus des yeux. « Chez nous, les anciens perdent la vue vers cinquante ans. Si on pouvait en fabriquer... » Inès réfléchit : « Il faut d'abord comprendre pourquoi ça grossit. »",
      "Elle verse de l'eau dans un verre, y plonge une cuillère. À travers le verre, la cuillère semble brisée en deux. Basile y voit un tour de magie. Inès sourit : « La lumière ne va pas à la même vitesse dans l'air et dans l'eau. Quand elle change de milieu, elle se plie. »",
      "Elle mesure l'angle d'un rayon qui entre dans l'eau et note les valeurs. « C'est toujours le même rapport. » Mathis est enfin convaincu : les mesures confirment une loi du Carnet. Puis elle place la lentille entre le Soleil et une feuille de papier et déplace l'une des deux jusqu'à obtenir un point lumineux net.",
      "Basile voudrait aussitôt fabriquer du verre dans un four. Le Carnet l'arrête à la page « Verre » : température extrême et projections de matière en fusion. Il faudra un grand atelier, des protections, et beaucoup d'essais. Pour l'instant, ils étudieront la lumière avec la lentille d'Anselme.",
    ],
    science: [
      {
        titre: "La réfraction : la lumière change de direction",
        texte: [
          "La lumière voyage à 300 000 km/s dans le vide, mais plus lentement dans la matière. L'indice de réfraction n d'un milieu compare cette vitesse à celle du vide : v = c / n. Pour l'air n ≈ 1, pour l'eau n ≈ 1,33, pour le verre n ≈ 1,5.",
          "Quand un rayon passe d'un milieu à un autre en biais, il change de direction : c'est la réfraction. La loi de Snell-Descartes relie les angles (mesurés par rapport à la perpendiculaire à la surface) : n₁ × sin θ₁ = n₂ × sin θ₂.",
        ],
        formule: "n₁ × sin θ₁ = n₂ × sin θ₂",
      },
      {
        titre: "Les lentilles convergentes",
        texte: [
          "Une lentille bombée au centre dévie les rayons vers un même point appelé foyer. La distance entre la lentille et ce point s'appelle la distance focale f. C'est ainsi qu'une loupe concentre la lumière du Soleil et qu'une lentille forme une image sur un écran.",
          "Pour un objet à la distance d₀ de la lentille, l'image nette se forme à la distance dᵢ donnée par la formule des lentilles minces (distances mesurées en mètres ou en centimètres).",
        ],
        formule: "1/f = 1/d₀ + 1/dᵢ",
      },
    ],
    experience:
      "Remplis un verre d'eau transparent et plonge-y un crayon ou une paille, en biais. Regarde de côté : le crayon semble « brisé » à la surface. Place ensuite un second verre ou une goutte d'eau sur du texte écrit : la goutte joue le rôle d'une petite loupe et grossit les lettres.",
    defis: [
      {
        type: "nombre",
        question:
          "Un rayon passe de l'air (n = 1) dans l'eau (n = 1,33) avec un angle d'incidence de 40°. Quel est l'angle de réfraction dans l'eau, en degrés ? (sin 40° ≈ 0,6428)",
        reponse: 28.9,
        tolerance: 0.02,
        unite: "°",
        indice: "Isole sin θ₂ dans 1 × sin 40° = 1,33 × sin θ₂, puis utilise la touche arcsin.",
        solution: [
          "sin θ₂ = (1 × sin 40°) / 1,33 = 0,6428 / 1,33 ≈ 0,4833",
          "θ₂ = arcsin(0,4833) ≈ 28,9°",
          "Le rayon se rapproche de la perpendiculaire : il entre dans un milieu où la lumière va moins vite.",
        ],
      },
      {
        type: "nombre",
        question:
          "Une lentille convergente a une distance focale de 10 cm. Un objet est placé à 15 cm devant elle. À quelle distance se forme l'image nette sur un écran, en centimètres ?",
        reponse: 30,
        tolerance: 0.01,
        unite: "cm",
        indice: "1/dᵢ = 1/f − 1/d₀. Mets au même dénominateur.",
        solution: [
          "1/dᵢ = 1/10 − 1/15",
          "1/10 = 3/30 et 1/15 = 2/30, donc 1/dᵢ = 1/30",
          "dᵢ = 30 cm",
        ],
      },
      {
        type: "nombre",
        question:
          "Quelle est la vitesse de la lumière dans l'eau (n = 1,33) ? On prend c = 3 × 10⁸ m/s. Donne la réponse en unités de 10⁸ m/s (par exemple 2,5 pour 2,5 × 10⁸ m/s).",
        reponse: 2.26,
        tolerance: 0.01,
        unite: "× 10⁸ m/s",
        indice: "v = c / n.",
        solution: ["v = c / n = 3 × 10⁸ / 1,33", "v ≈ 2,26 × 10⁸ m/s", "La lumière va environ 25 % plus lentement dans l'eau que dans le vide."],
      },
      {
        type: "choix",
        question: "Pourquoi une cuillère semble-t-elle « cassée » dans un verre d'eau ?",
        options: [
          "L'eau ramollit le métal",
          "La lumière change de direction en passant de l'eau à l'air",
          "Le verre est déformé",
          "La cuillère se plie vraiment",
        ],
        bonne: 1,
        indice: "Pense à la vitesse de la lumière dans deux milieux différents.",
        solution: [
          "La lumière change de vitesse à la surface de l'eau : elle est réfractée.",
          "Notre cerveau suppose que la lumière arrive en ligne droite, d'où l'impression d'un objet décalé.",
        ],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : ne regarde jamais le Soleil, même à travers une loupe, des jumelles ou une lentille, car tu pourrais t'abîmer la vue de façon permanente. Une loupe concentre la chaleur et peut enflammer du papier : ne la dirige jamais vers quelqu'un ni vers des matières inflammables. Ne tente pas de fabriquer du verre toi-même, c'est dangereux.",
    enVrai:
      "Le savant arabe Ibn al-Haytham (Alhazen) écrit son Livre d'optique vers 1021 et explique comment on voit et comment la lumière se courbe. Les premières lunettes apparaissent en Italie vers 1286. La loi de la réfraction a été formulée par le Néerlandais Willebrord Snell vers 1621, puis publiée par René Descartes en 1637. En 1609, Galilée utilise une lunette pour observer les lunes de Jupiter et les phases de Vénus.",
    suite:
      "La lentille concentre la lumière du Soleil en un point si brillant que Basile jette le pas : la feuille fume. Mais le soir tombe, et dans la nuit noire, une lueur étrange éclaire un rocher de la forêt : une veine de pierre rougeâtre. « Du minerai ! » souffle Anselme. « Les anciens disaient qu'on en tirait des outils. »",
  },

  // 11. Métaux
  {
    id: "metaux",
    numero: 11,
    titre: "Du caillou au métal",
    matieres: ["Chimie"],
    niveau: 3,
    recit: [
      "La pierre rougeâtre que Basile ramène est lourde pour sa taille. Inès la gratte avec un clou : une poussière rouille tombe. « Une roche riche en fer, comme celle de la rouille... » Mathis se moque : « Comment un caillou peut-il devenir une lame ? » Le Carnet répond : « Retirer l'oxygène du minerai. »",
      "Inès explique : le fer ne se trouve presque jamais pur dans la nature. Il est combiné à l'oxygène, sous forme d'oxyde. Pour récupérer le métal, il faut arracher l'oxygène au fer, avec une substance qui a plus d'affinité que lui pour l'oxygène. Les anciens utilisaient du carbone, sous forme de charbon de bois.",
      "Lina fait remarquer que rien ne se perd : le fer et l'oxygène étaient là depuis le début. Il suffit de les séparer et de peser. Inès invente un tableau avec les masses d'atomes (le fer pèse 56 unités, l'oxygène 16) et calcule à l'avance combien de métal on peut espérer.",
      "Un soir, Basile veut tenter l'expérience avec un grand feu. Le Carnet est clair : un four à haute température est dangereux, les fumées contiennent un gaz invisible qui tue sans prévenir, le monoxyde de carbone. Le groupe renonce pour l'instant et décide de comprendre la chimie avant de construire quoi que ce soit.",
    ],
    science: [
      {
        titre: "Minerai, oxyde et réduction",
        texte: [
          "Un minerai est une roche qui contient un métal combiné à d'autres éléments. Le minerai de fer contient souvent de l'oxyde de fer, par exemple Fe₂O₃, de la même famille que la rouille. Extraire le métal, c'est le réduire : lui retirer l'oxygène.",
          "Le carbone peut jouer ce rôle. Dans la réaction, le carbone s'empare de l'oxygène et forme du dioxyde de carbone, tandis que le fer métallique est libéré. La masse totale est conservée : tout ce qui entre se retrouve en sortie.",
        ],
        formule: "2 Fe₂O₃ + 3 C → 4 Fe + 3 CO₂",
      },
      {
        titre: "Compter les atomes : la mole",
        texte: [
          "Les atomes sont trop petits pour être comptés un par un. Les chimistes utilisent la mole : 1 mole contient environ 6,02 × 10²³ entités (le nombre d'Avogadro). La masse d'une mole d'un élément s'appelle la masse molaire (en g/mol).",
          "Pour passer de la masse à la quantité de matière, on divise par la masse molaire : n = m / M. Ici, M(Fe) = 56 g/mol, M(O) = 16 g/mol, donc M(Fe₂O₃) = 2 × 56 + 3 × 16 = 160 g/mol.",
        ],
        formule: "n = m / M",
      },
    ],
    experience:
      "Humidifie un peu de laine d'acier avec du vinaigre pour enlever sa protection, essore-la, et enfonce-la au fond d'un verre. Retourne le verre dans une assiette creuse remplie d'eau. En quelques heures, l'eau monte d'environ un cinquième dans le verre : le fer rouille en consommant le dioxygène de l'air, qui représente environ 21 % du volume.",
    defis: [
      {
        type: "nombre",
        question:
          "Un échantillon contient 800 g d'oxyde de fer Fe₂O₃ pur. Quelle masse maximale de fer métallique peut-on en tirer, en grammes ? (M(Fe) = 56 g/mol ; M(O) = 16 g/mol ; 1 mol de Fe₂O₃ contient 2 mol de Fe)",
        reponse: 560,
        tolerance: 0.01,
        unite: "g",
        indice: "Calcule M(Fe₂O₃), puis la quantité de matière de Fe₂O₃, puis double pour le fer.",
        solution: [
          "M(Fe₂O₃) = 2 × 56 + 3 × 16 = 112 + 48 = 160 g/mol",
          "n(Fe₂O₃) = 800 / 160 = 5 mol",
          "n(Fe) = 2 × 5 = 10 mol",
          "m(Fe) = 10 × 56 = 560 g",
        ],
      },
      {
        type: "nombre",
        question:
          "Combien de moles de fer y a-t-il dans 280 g de fer pur ? (M(Fe) = 56 g/mol)",
        reponse: 5,
        tolerance: 0.01,
        unite: "mol",
        indice: "n = m / M.",
        solution: ["n = m / M = 280 / 56", "n = 5 mol"],
      },
      {
        type: "choix",
        question:
          "Un clou en fer qui rouille complètement devient un peu plus lourd. Pourquoi ?",
        options: [
          "La rouille est plus légère que le fer",
          "La rouille s'est combinée avec l'oxygène de l'air, qui s'ajoute à la masse",
          "Le fer a absorbé de l'eau sans réaction",
          "La masse n'est pas conservée",
        ],
        bonne: 1,
        indice: "La rouille est un oxyde de fer. D'où vient l'oxygène ?",
        solution: [
          "Le fer réagit avec le dioxygène de l'air (et l'eau) pour former de la rouille.",
          "L'oxygène capté s'ajoute à la masse du fer : le total est conservé, mais le clou pèse plus.",
        ],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : ne tente jamais de chauffer du minerai ou du métal dans un four ou un grand feu. Les températures sont extrêmes, le métal fondu peut projeter, et les fumées contiennent du monoxyde de carbone, un gaz toxique invisible et sans odeur. L'expérience de la laine d'acier est sans danger.",
    enVrai:
      "Les premiers objets en cuivre apparaissent vers 5000 av. J.-C., le bronze (cuivre et étain) vers 3300 av. J.-C. Le travail du fer se répand vers 1200 av. J.-C., notamment chez les Hittites en Anatolie : c'est le début de l'âge du fer. Plus tard, Antoine Lavoisier montre en 1789 que la masse se conserve lors des réactions chimiques, ce qui permet de calculer les quantités avec la mole.",
    suite:
      "Alors que le groupe planche sur les calculs, un éclair fend le ciel. Un coup de tonnerre secoue la salle des machines de l'abri, et pour une seconde, l'écran de Sève s'allume : « ...énergie... pile... » Puis noir complet. Inès referme le Carnet : « Et si on fabriquait nous-mêmes de l'électricité ? »",
  },

  // 12. Pile électrique
  {
    id: "pile",
    numero: 12,
    titre: "Une étincelle dans un citron",
    matieres: ["Physique", "Chimie"],
    niveau: 3,
    recit: [
      "Sève a parlé : « énergie... pile ». Inès retourne dans l'abri, fouille les tiroirs. Elle trouve des pièces de monnaie en cuivre, des clous galvanisés (recouverts de zinc), et un tas de câbles dénudés. Dehors, des citronniers sauvages, étrangement vigoureux, poussent près d'un mur de l'abri.",
      "Basile plante un clou et une pièce dans un citron, relie les deux avec un fil et un petit voltmètre rafistolé. L'aiguille bouge à peine : moins d'un volt. « Ça ne servira à rien », souffle-t-il. Inès sourit : « Un citron donne un petit peu. Cinq en donnent plus. »",
      "Ils relient plusieurs citrons en série, la pièce de l'un au clou du suivant. La tension s'additionne : l'aiguille grimpe. Une petite diode électroluminescente se met à briller d'un rouge timide. Anselme recule d'un pas, fasciné. « La foudre dans un fruit ! »",
      "Mathis veut savoir combien d'électricité passe. Inès sort le Carnet : « Il y a trois grandeurs : la tension (volts), l'intensité (ampères) et la résistance (ohms). Elles sont liées par une règle simple. » Elle note U = R × I. « Quand on connaît deux grandeurs, on trouve la troisième. »",
    ],
    science: [
      {
        titre: "Comment fonctionne une pile ?",
        texte: [
          "Dans une pile, deux métaux différents (ici le zinc du clou et le cuivre de la pièce) plongent dans un liquide qui conduit l'électricité (le jus acide du citron). Le zinc a plus tendance à perdre des électrons que le cuivre : il les cède et les électrons circulent dans le fil, du zinc vers le cuivre. C'est un courant électrique.",
          "Une pile à citron produit environ 0,9 V. Pour augmenter la tension, on branche plusieurs éléments en série : les tensions s'additionnent. En parallèle, la tension reste la même, mais la pile dure plus longtemps.",
        ],
      },
      {
        titre: "Tension, intensité, résistance : la loi d'Ohm",
        texte: [
          "La tension U (en volts, V) est la « poussée » qui fait circuler les électrons. L'intensité I (en ampères, A) mesure combien de charges passent par seconde. La résistance R (en ohms, Ω) dit à quel point un composant freine le courant.",
          "La loi d'Ohm relie les trois : pour une résistance, U = R × I. La puissance électrique P (en watts, W) est égale à P = U × I : c'est l'énergie transférée chaque seconde.",
        ],
        formule: "U = R × I   et   P = U × I",
      },
    ],
    experience:
      "Plante dans un citron un clou galvanisé et une pièce de cuivre, à 2 cm l'un de l'autre, et mesure la tension avec un multimètre réglé sur les volts continus. Relie ensuite quatre citrons en série (la pièce de l'un au clou du suivant) et mesure aux deux bouts libres : la tension est environ 4 fois plus grande.",
    defis: [
      {
        type: "nombre",
        question:
          "Chaque citron produit environ 0,9 V. Quelle tension obtient-on en reliant 4 citrons en série, en volts ?",
        reponse: 3.6,
        tolerance: 0.01,
        unite: "V",
        indice: "En série, les tensions s'additionnent.",
        solution: ["U totale = 4 × 0,9 V", "U totale = 3,6 V"],
      },
      {
        type: "nombre",
        question:
          "Une petite ampoule est alimentée sous 3 V et le courant qui la traverse est de 0,05 A. Quelle est sa résistance, en ohms ?",
        reponse: 60,
        tolerance: 0.01,
        unite: "Ω",
        indice: "U = R × I donc R = U / I.",
        solution: ["R = U / I = 3 / 0,05", "R = 60 Ω"],
      },
      {
        type: "choix",
        question:
          "On relie deux piles identiques en parallèle (borne + avec borne +, borne − avec borne −). Que devient la tension aux bornes de l'ensemble ?",
        options: [
          "Elle double",
          "Elle est divisée par deux",
          "Elle reste la même qu'avec une seule pile",
          "Elle devient nulle",
        ],
        bonne: 2,
        indice: "En parallèle, les tensions ne s'additionnent pas.",
        solution: [
          "En série, les tensions s'additionnent.",
          "En parallèle, la tension reste celle d'une seule pile, mais le courant peut être fourni plus longtemps.",
        ],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : ne branche jamais rien sur une prise de courant (230 V) et n'utilise jamais de fils dénudés dans une prise. Seules les piles à fruits et les petites piles du commerce de 4,5 V ou moins conviennent aux expériences. Ne court-circuite jamais une pile avec un fil : elle chauffe.",
    enVrai:
      "En 1780, Luigi Galvani observe que des cuisses de grenouille se contractent au contact de deux métaux. Alessandro Volta pense que l'électricité vient des métaux et non de l'animal. En 1800, il présente à la Royal Society de Londres la première pile électrique : un empilement de disques de zinc et d'argent séparés par du carton imbibé d'eau salée. Georg Simon Ohm publie sa loi en 1827. En l'honneur de Volta, l'unité de tension s'appelle le volt.",
    suite:
      "Les citrons s'épuisent, la lueur de la diode faiblit et s'éteint. « Les piles ne durent pas, constate Mathis. Il faut un moyen de fabriquer de l'électricité en continu. » Dans l'abri, Inès trouve un vieil aimant, coincé dans une machine. Elle sent qu'elle tient quelque chose d'important.",
  },

  // 13. Aimant, boussole, induction
  {
    id: "induction",
    numero: 13,
    titre: "Le courant qui vient de l'aimant",
    matieres: ["Physique"],
    niveau: 4,
    recit: [
      "L'aimant récupéré dans l'abri attire des clous, des pièces de fer, et fait pivoter une aiguille posée sur un morceau de liège flottant dans l'eau. L'aiguille tourne et s'immobilise, toujours dans la même direction : nord-sud. « Une boussole ! s'exclame Basile. On pourra naviguer par temps couvert. »",
      "Mathis hoche la tête : « D'accord, mais l'aimant n'est pas une pile. » Inès approche l'aimant d'une bobine de fil de cuivre raccordée à leur voltmètre. Rien ne bouge. Puis elle plonge l'aimant d'un geste vif dans la bobine : l'aiguille du voltmètre saute. Elle le retire : l'aiguille repart de l'autre côté !",
      "« Ça marche seulement quand l'aimant bouge ! » s'écrie Lina. Inès hoche la tête, les yeux brillants. « Quand le champ magnétique qui traverse la bobine change, une tension apparaît. Plus on va vite, plus il y en a. Plus il y a de spires dans la bobine, plus il y en a aussi. »",
      "Basile comprend aussitôt le principe de la manivelle : fixer des aimants sur une roue qui tourne devant des bobines. Il construit un prototype, tourne la manivelle, et la diode brille longtemps. L'abri entier est éclairé d'une lumière blanche pour la première fois depuis des siècles. Et sur l'écran de Sève, une ligne de texte clignote : « ...mémoire... en cours de restauration... »",
    ],
    science: [
      {
        titre: "Le magnétisme et la boussole",
        texte: [
          "Un aimant possède deux pôles, nord et sud. Deux pôles identiques se repoussent, deux pôles opposés s'attirent. La Terre se comporte comme un énorme aimant : son champ magnétique oriente l'aiguille d'une boussole.",
          "Le pôle de l'aiguille qu'on appelle « nord » pointe vers le nord géographique. En réalité, c'est parce que, près du pôle Nord géographique, se trouve un pôle magnétique sud de la Terre.",
        ],
      },
      {
        titre: "L'induction électromagnétique",
        texte: [
          "Lorsque le flux magnétique à travers une bobine varie (par exemple parce qu'on approche ou éloigne un aimant), une tension apparaît dans la bobine. C'est l'induction. Sans variation, il n'y a aucune tension, même avec un aimant très puissant.",
          "La tension moyenne induite dans une bobine de N spires est égale à N fois la variation du flux, divisée par la durée de cette variation : |e| = N × ΔΦ / Δt, avec Φ en webers (Wb), t en secondes et e en volts. Dans un alternateur, des aimants tournent devant des bobines : la tension change de sens à chaque demi-tour, d'où le courant alternatif.",
        ],
        formule: "|e| = N × ΔΦ / Δt",
      },
    ],
    experience:
      "Aimante une aiguille à coudre en la frottant une vingtaine de fois dans le même sens avec un aimant. Pose-la délicatement sur un petit morceau de liège ou de feuille flottant dans un bol d'eau, à l'écart de tout objet métallique. Elle s'oriente nord-sud. Vérifie avec une boussole de ton téléphone ou du commerce.",
    defis: [
      {
        type: "nombre",
        question:
          "Une bobine de 200 spires est traversée par un flux qui varie de 0,0003 Wb en 0,05 s. Quelle tension moyenne est induite, en volts ?",
        reponse: 1.2,
        tolerance: 0.02,
        unite: "V",
        indice: "|e| = N × ΔΦ / Δt. Calcule d'abord ΔΦ / Δt.",
        solution: [
          "ΔΦ / Δt = 0,0003 / 0,05 = 0,006 V par spire",
          "|e| = 200 × 0,006",
          "|e| = 1,2 V",
        ],
      },
      {
        type: "nombre",
        question:
          "Un alternateur tourne à 3 000 tours par minute. Chaque tour produit une période complète du courant. Quelle est la fréquence du courant produit, en hertz ?",
        reponse: 50,
        tolerance: 0.01,
        unite: "Hz",
        indice: "La fréquence est le nombre de périodes par seconde. Convertis les minutes en secondes.",
        solution: [
          "3 000 tours par minute = 3 000 / 60 tours par seconde",
          "3 000 / 60 = 50 tours/s",
          "Fréquence = 50 Hz, la fréquence du courant du réseau en Suisse et en Europe.",
        ],
      },
      {
        type: "choix",
        question:
          "Inès insère un aimant dans une bobine puis le laisse immobile à l'intérieur. Que mesure le voltmètre pendant que l'aimant reste immobile ?",
        options: [
          "La tension maximale",
          "Une tension constante non nulle",
          "Une tension nulle",
          "Une tension qui s'inverse sans cesse",
        ],
        bonne: 2,
        indice: "Il faut que le flux magnétique change pour qu'une tension apparaisse.",
        solution: [
          "L'induction a lieu seulement quand le flux varie.",
          "Si l'aimant est immobile, le flux est constant : aucune tension n'est induite.",
        ],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : ne branche jamais un montage de ce genre sur une prise ou sur le réseau électrique. Garde les aimants puissants loin des cartes, des téléphones et des pacemakers, et surtout hors de portée des jeunes enfants (les petits aimants avalés sont très dangereux).",
    enVrai:
      "La boussole est décrite en Chine dès le XIe siècle (dynastie des Song) pour la navigation. En 1269, Pierre de Maricourt décrit les pôles de l'aimant et en 1600, William Gilbert comprend que la Terre elle-même est un aimant. En 1820, Hans Christian Ørsted montre qu'un courant électrique dévie une aiguille aimantée. En 1831, Michael Faraday découvre l'induction : en déplaçant un aimant dans une bobine, il génère un courant. Cette idée est au cœur de toutes nos centrales électriques.",
    suite:
      "Maintenant qu'ils ont de l'électricité, la salle de commandes s'illumine. Mais la nuit, une rumeur se propage chez les gens de la Combe : l'eau du lac bouillonne et la rivière, plus bas, est trop faible pour faire tourner leurs roues. Il faut une autre source de force. Et Basile pense à la vapeur d'eau.",
  },

  // 14. Chaleur et machines
  {
    id: "machines",
    numero: 14,
    titre: "La force de la vapeur",
    matieres: ["Physique"],
    niveau: 4,
    recit: [
      "Dans la cuisine de la Combe, Maëlle fait cuire des légumes sous un couvercle bien lourd. Soudain, le couvercle se met à danser, la vapeur s'échappe en sifflant. Basile bondit, ravi : « La vapeur peut pousser un couvercle ! Elle pourrait pousser bien plus lourd ! »",
      "Inès relie l'observation à une idée du Carnet : l'eau qui bout devient vapeur et occupe beaucoup plus de place. Si on l'enferme, sa pression augmente. Et la pression, c'est de la force répartie sur une surface. « Un piston de grande surface peut transformer une toute petite pression en énorme poussée. »",
      "Mathis se montre sceptique : « Une machine qui tourne éternellement avec de la chaleur ? » Inès le contredit : « Pas éternellement. Une machine à vapeur ne transforme qu'une petite part de la chaleur en mouvement. Le reste est perdu, car la chaleur passe toujours du chaud vers le froid. »",
      "Le groupe imagine donc un plan : une chaudière, un piston, une bielle, une roue. Mais le Carnet les arrête : pas de chaudière fermée sans soupape, pas de grande pression sans calculs. Une chaudière qui éclate est une bombe. Ils décident d'étudier sérieusement les calculs avant de bâtir quoi que ce soit.",
    ],
    science: [
      {
        titre: "La pression : une force répartie",
        texte: [
          "La pression est la force exercée sur une surface : P = F / S. L'unité est le pascal (Pa), égal à 1 newton par mètre carré. La pression atmosphérique au niveau de la mer vaut environ 100 000 Pa (1 bar).",
          "Plus la surface est grande, plus la même pression produit une force importante. Dans une cocotte-minute, la pression augmente et l'eau ne bout qu'à plus de 100 °C : la cuisson est plus rapide. Cette hausse de la température d'ébullition avec la pression est exploitée par les machines à vapeur.",
        ],
        formule: "P = F / S   donc   F = P × S",
      },
      {
        titre: "Rendement et limite de Carnot",
        texte: [
          "Le rendement d'une machine compare ce qu'elle fournit (le travail utile W) à ce qu'elle reçoit (la chaleur Q) : η = W / Q. Il est toujours inférieur à 100 %, car une partie de la chaleur est inévitablement rejetée vers la source froide.",
          "Sadi Carnot a montré qu'une machine qui fonctionne entre une source chaude (température T_c) et une source froide (T_f), en kelvins, ne peut pas dépasser le rendement η_max = 1 − T_f / T_c. Les températures en kelvins sont égales aux °C plus 273.",
        ],
        formule: "η = W / Q   et   η_max = 1 − T_f / T_c",
      },
    ],
    experience:
      "Remplis un grand verre d'eau jusqu'au bord, pose un carton plat dessus (une carte postale), puis retourne l'ensemble au-dessus d'un évier, la main sous le carton. Retire doucement la main : le carton reste collé et l'eau ne tombe pas. C'est la pression de l'air (environ 100 000 Pa) qui le pousse vers le haut. Fais l'expérience au-dessus d'une bassine.",
    defis: [
      {
        type: "nombre",
        question:
          "La vapeur exerce une surpression de 200 000 Pa sur un piston dont la surface vaut 0,05 m². Quelle force pousse le piston, en newtons ?",
        reponse: 10000,
        tolerance: 0.01,
        unite: "N",
        indice: "F = P × S.",
        solution: ["F = P × S = 200 000 × 0,05", "F = 10 000 N, soit le poids d'environ une tonne."],
      },
      {
        type: "nombre",
        question:
          "Une machine à vapeur reçoit 50 kJ de chaleur et fournit un travail de 8 kJ. Quel est son rendement, en pourcentage ?",
        reponse: 16,
        tolerance: 0.01,
        unite: "%",
        indice: "η = W / Q, puis multiplie par 100 pour avoir des pourcents.",
        solution: ["η = 8 / 50 = 0,16", "η = 16 %", "Les 42 kJ restants sont perdus sous forme de chaleur."],
      },
      {
        type: "nombre",
        question:
          "Une machine thermique fonctionne entre une source chaude à 400 K et une source froide à 300 K. Quel est son rendement maximal théorique, en pourcentage ?",
        reponse: 25,
        tolerance: 0.01,
        unite: "%",
        indice: "η_max = 1 − T_f / T_c. Les températures sont déjà en kelvins.",
        solution: ["η_max = 1 − 300 / 400", "η_max = 1 − 0,75 = 0,25", "Soit 25 % au maximum, même avec une machine parfaite."],
      },
      {
        type: "choix",
        question: "Pourquoi l'eau bout-elle à plus de 100 °C dans une cocotte-minute fermée ?",
        options: [
          "Parce que la flamme est plus chaude",
          "Parce que l'eau y est plus salée",
          "Parce que la pression plus élevée retarde l'ébullition",
          "Parce que la vapeur est moins dense",
        ],
        bonne: 2,
        indice: "La température d'ébullition dépend de la pression autour du liquide.",
        solution: [
          "À pression plus élevée, il faut une température plus haute pour que les molécules d'eau s'échappent en vapeur.",
          "La cocotte fermée retient la vapeur : la pression monte et l'eau bout à plus de 100 °C.",
        ],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : ne chauffe jamais un récipient fermé sans soupape de sécurité. La pression monte très vite et il peut exploser avec une grande violence. Ne bricole pas de chaudière ni de machine à vapeur, et utilise toujours une cocotte-minute en respectant le mode d'emploi.",
    enVrai:
      "En 1679, le Français Denis Papin invente le « digesteur », ancêtre de l'autocuiseur, avec une soupape de sécurité. Thomas Newcomen construit en 1712 la première machine à vapeur utilisable pour pomper l'eau des mines. James Watt l'améliore à partir de 1769 avec un condenseur séparé, ce qui améliore beaucoup son rendement. En 1824, Sadi Carnot publie ses « Réflexions sur la puissance motrice du feu », qui posent les bases de la thermodynamique.",
    suite:
      "La nuit, un cri réveille tout le monde. Un enfant de la Combe brûle de fièvre, puis un deuxième, puis une femme. Une maladie se propage dans le camp. Lina pâlit : les lavages, le savon, tout le travail accompli pourrait ne pas suffire. Il va falloir comprendre l'ennemi invisible.",
  },

  // 15. Microbes, hygiène et antibiotiques
  {
    id: "microbes",
    numero: 15,
    titre: "L'ennemi invisible",
    matieres: ["Biologie", "Maths"],
    niveau: 4,
    recit: [
      "La Combe est en alerte. Trois enfants et une vieille femme sont malades, avec une forte fièvre. Maëlle fait bouillir de l'eau et applique ses herbes, sans savoir si cela suffira. Lina, la voix tremblante, reconnaît les symptômes d'une infection bactérienne. « Il faut isoler les malades et se laver les mains à chaque soin. »",
      "Mathis proteste : « Le savon enlève la saleté, pas la maladie. » Lina lui montre le Carnet, où une illustration montre des points minuscules grouper et se multiplier dans une plaie. « Chaque bactérie se divise en deux toutes les vingt minutes environ. Après trois heures, ça fait combien ? » Mathis fait le calcul à voix haute et pâlit.",
      "Inès explique alors que le geste le plus efficace est aussi le plus simple : se laver les mains au savon, frotter 30 secondes, rincer. Un vrai lavage fait disparaître plus de 99 % des microbes. Les malades sont isolés et on désinfecte les bols à l'eau bouillante. Le lendemain, la fièvre ne monte plus chez les nouveaux cas.",
      "Pour ceux qui sont déjà malades, Lina se souvient d'une page du Carnet sur la moisissure verte du pain : certaines moisissures sécrètent des substances qui tuent des bactéries. Mais le Carnet précise : « Ne jamais soigner avec une moisissure au hasard. Seul un médecin peut prescrire. » Le groupe envoie un messager chercher les connaissances des anciens... et regarde l'écran de Sève : une nouvelle ligne s'affiche.",
    ],
    science: [
      {
        titre: "Bactéries, virus et hygiène",
        texte: [
          "Les bactéries sont des cellules minuscules, souvent utiles (celles de l'intestin), parfois dangereuses. Les virus sont encore plus petits : ils ne peuvent se multiplier que dans les cellules d'un être vivant. Le lavage des mains au savon est l'un des gestes de santé les plus efficaces : il détache et emporte les microbes, comme il emporte la graisse.",
          "Quand les conditions sont bonnes, une bactérie se divise en deux à intervalles réguliers : la croissance est exponentielle. Après n divisions, une bactérie en a donné 2ⁿ.",
        ],
        formule: "N = N₀ × 2ⁿ",
      },
      {
        titre: "Les antibiotiques",
        texte: [
          "Un antibiotique est une substance qui tue des bactéries ou les empêche de se multiplier. Il ne fonctionne PAS contre les virus (rhume, grippe). Chaque antibiotique agit sur des familles de bactéries précises.",
          "Mal utilisés, les antibiotiques favorisent les bactéries résistantes : celles qui survivent se multiplient et transmettent leur résistance. C'est pourquoi les antibiotiques ne doivent être pris que sur prescription d'un médecin, jamais en automédication, ni fabriqués à la maison.",
        ],
      },
    ],
    experience:
      "Coupe une tranche de pain et mets-la en deux morceaux : l'un dans un sachet fermé avec quelques gouttes d'eau, l'autre dans un sachet bien sec. Observe pendant une semaine, sans ouvrir les sachets : les moisissures se développent là où il y a de l'humidité. Jette ensuite les sachets fermés sans les ouvrir. Lave-toi les mains.",
    defis: [
      {
        type: "nombre",
        question:
          "Une bactérie se divise en deux toutes les 20 minutes. Combien de bactéries y a-t-il après 3 heures, à partir d'une seule ?",
        reponse: 512,
        tolerance: 0.01,
        indice: "Combien de divisions en 3 h = 180 min ? Utilise N = 2ⁿ.",
        solution: [
          "3 h = 180 min ; 180 / 20 = 9 divisions.",
          "N = 2⁹ = 512 bactéries.",
        ],
      },
      {
        type: "nombre",
        question:
          "Sur une main, il y a 1 000 000 de bactéries. Un bon lavage au savon en élimine 99,9 %. Combien en reste-t-il ?",
        reponse: 1000,
        tolerance: 0.01,
        indice: "Il reste 100 % − 99,9 % = 0,1 % de la population.",
        solution: [
          "Part restante : 100 − 99,9 = 0,1 % = 0,001",
          "1 000 000 × 0,001 = 1 000 bactéries.",
        ],
      },
      {
        type: "choix",
        question: "Un antibiotique est-il efficace contre le rhume, une maladie causée par un virus ?",
        options: [
          "Oui, contre tous les microbes",
          "Non, il agit sur les bactéries, pas sur les virus",
          "Oui, mais seulement le matin",
          "Seulement si on en prend beaucoup",
        ],
        bonne: 1,
        indice: "Un virus n'a pas la même structure qu'une bactérie.",
        solution: [
          "Les antibiotiques ciblent des mécanismes propres aux bactéries.",
          "Les virus se multiplient dans nos cellules : l'antibiotique n'a aucune prise.",
        ],
      },
      {
        type: "choix",
        question: "Pourquoi l'usage inutile d'antibiotiques pose-t-il un problème ?",
        options: [
          "Il rend les microbes plus gentils",
          "Il favorise la survie des bactéries résistantes",
          "Il fait grossir",
          "Il rend le savon inutile",
        ],
        bonne: 1,
        indice: "Quelles bactéries survivent quand on utilise un antibiotique ?",
        solution: [
          "Parmi des millions de bactéries, quelques-unes résistent par hasard.",
          "Elles survivent et se multiplient : la résistance se répand.",
        ],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : ne cherche jamais à fabriquer ou à tester un médicament, ne soigne pas une infection avec une moisissure et ne prends jamais d'antibiotique sans prescription médicale. En cas de fièvre ou de plaie infectée, consulte un médecin.",
    enVrai:
      "En 1847, le médecin hongrois Ignaz Semmelweis impose le lavage des mains aux médecins d'une maternité de Vienne et fait chuter la mortalité des mères. En 1861-1862, Louis Pasteur prouve, avec ses ballons à col de cygne, que les microbes ne naissent pas spontanément : ils viennent de l'air. En 1882, Robert Koch identifie le bacille de la tuberculose. En 1928, à Londres, Alexander Fleming remarque qu'une moisissure du genre Penicillium empêche des bactéries de se développer sur une boîte de culture ; Howard Florey et Ernst Chain en tirent le médicament dans les années 1940.",
    suite:
      "Les malades se rétablissent. Dans la nuit, l'écran de Sève s'allume pleinement, et sa voix, enfin claire, parle : « Le programme de restauration est terminé. Signal détecté. Fréquence inconnue. Source : à plusieurs centaines de kilomètres. » Tous se regardent. Quelqu'un d'autre est vivant, et il envoie un message.",
  },

  // 16. La radio
  {
    id: "radio",
    numero: 16,
    titre: "Le signal",
    matieres: ["Physique", "Maths"],
    niveau: 4,
    recit: [
      "Sève parle d'une voix posée, enfin débarrassée de ses grésillements. « J'ai reçu un signal en provenance du sud-est. Il se répète toutes les dix minutes : trois impulsions longues, trois courtes. » Mathis lâche un « Prouve-le » presque inaudible, puis se tait, parce que, pour la première fois, il y a quelque chose à entendre.",
      "Basile, fiévreux d'enthousiasme, réunit tout ce qu'ils ont fabriqué : le générateur à aimants, les bobines, les fils de cuivre. Inès rappelle qu'un signal radio est une onde qui voyage à la vitesse de la lumière, comme la lumière visible, mais avec une longueur d'onde bien plus grande. « Pour l'entendre, il nous faut une antenne et un circuit accordé sur la bonne fréquence. »",
      "Elle dessine, dans la poussière, une onde avec ses crêtes et ses creux : la distance entre deux crêtes est la longueur d'onde λ, le nombre de crêtes qui passent chaque seconde est la fréquence f. « Si on connaît l'une, on connaît l'autre. La relation est simple : λ = c / f. »",
      "Pendant des nuits, le groupe tâtonne, ajuste, mesure. Enfin, un soir de brouillard, un grésillement sort d'un haut-parleur de fortune, puis une voix humaine, lointaine mais claire : « ... ici l'observatoire de la mer... nous sommes quarante... vous nous entendez ? ». Les adolescents se regardent, la gorge nouée. La civilisation n'est pas morte : elle attendait seulement d'être rallumée.",
    ],
    science: [
      {
        titre: "Les ondes électromagnétiques",
        texte: [
          "Les ondes radio, la lumière visible, les rayons X sont toutes des ondes électromagnétiques. Elles se déplacent dans le vide à la même vitesse, c ≈ 3 × 10⁸ m/s. Elles se distinguent par leur fréquence f (en hertz, Hz) ou, de façon équivalente, par leur longueur d'onde λ (en mètres).",
          "La relation entre les trois : c = λ × f. Plus la fréquence est grande, plus la longueur d'onde est petite. Une station FM à 100 MHz (100 millions de hertz) a une longueur d'onde d'environ 3 m.",
        ],
        formule: "λ = c / f",
      },
      {
        titre: "Comment transporter une voix ?",
        texte: [
          "La voix humaine est un son, trop lent et trop faible pour voyager loin. On l'accroche à une onde porteuse de haute fréquence : c'est la modulation. En modulation d'amplitude (AM), on fait varier la force de l'onde porteuse ; en modulation de fréquence (FM), on fait varier sa fréquence.",
          "À la réception, un circuit accordé sélectionne la bonne fréquence parmi toutes celles qui traversent l'antenne, puis on extrait la voix de l'onde porteuse. Une antenne efficace mesure souvent un quart de la longueur d'onde.",
        ],
      },
    ],
    experience:
      "Allume un petit poste de radio AM à piles et règle-le entre deux stations, sur le bruit de fond. Prends une pile plate de 4,5 V et un fil. Touche brièvement un des pôles avec le fil, puis retire-le, tout près de l'antenne de la radio : tu entends des craquements. Chaque coupure de courant émet une onde radio brève que le poste reçoit.",
    defis: [
      {
        type: "nombre",
        question:
          "Une station FM émet à la fréquence de 100 MHz (100 000 000 Hz). Quelle est la longueur d'onde de son signal, en mètres ? (c = 3 × 10⁸ m/s)",
        reponse: 3,
        tolerance: 0.01,
        unite: "m",
        indice: "λ = c / f. Écris 100 MHz en hertz.",
        solution: ["f = 100 MHz = 1 × 10⁸ Hz", "λ = c / f = 3 × 10⁸ / 1 × 10⁸", "λ = 3 m"],
      },
      {
        type: "nombre",
        question:
          "Une onde moyenne a une longueur d'onde de 600 m. Quelle est sa fréquence, en kilohertz (kHz) ? (c = 3 × 10⁸ m/s ; 1 kHz = 1 000 Hz)",
        reponse: 500,
        tolerance: 0.01,
        unite: "kHz",
        indice: "f = c / λ. Convertis ensuite des hertz en kilohertz.",
        solution: [
          "f = c / λ = 3 × 10⁸ / 600",
          "f = 500 000 Hz",
          "500 000 Hz = 500 kHz.",
        ],
      },
      {
        type: "nombre",
        question:
          "Un signal radio se déplace à 300 000 km/s. La Lune est à environ 384 400 km. Combien de temps met le signal pour l'atteindre, en secondes ?",
        reponse: 1.28,
        tolerance: 0.02,
        unite: "s",
        indice: "temps = distance / vitesse.",
        solution: ["t = d / v = 384 400 / 300 000", "t ≈ 1,28 s", "C'est pourquoi les échanges radio avec les astronautes sur la Lune avaient un léger décalage."],
      },
      {
        type: "choix",
        question: "Dans la modulation de fréquence (FM), qu'est-ce qui varie pour transporter le son ?",
        options: [
          "La vitesse de l'onde dans le vide",
          "La force de l'onde porteuse",
          "La fréquence de l'onde porteuse",
          "La couleur de l'onde",
        ],
        bonne: 2,
        indice: "Le nom de la méthode te donne la réponse.",
        solution: [
          "En FM, la fréquence de l'onde porteuse varie légèrement au rythme du son.",
          "En AM, c'est l'amplitude (la force) qui varie.",
          "La vitesse de l'onde, elle, ne change pas : c'est c.",
        ],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : n'installe jamais d'antenne près de lignes électriques, n'utilise pas la prise de courant pour tes expériences, et n'émets pas sans autorisation : un émetteur peut brouiller les communications de secours. Écouter est toujours sans danger.",
    enVrai:
      "En 1865, James Clerk Maxwell prédit par le calcul l'existence d'ondes électromagnétiques voyageant à la vitesse de la lumière. En 1887-1888, Heinrich Hertz les produit et les détecte dans son laboratoire : l'unité de fréquence porte son nom. Guglielmo Marconi réalise ses premières liaisons sans fil en 1895, puis relie la Cornouailles (Angleterre) à Terre-Neuve (Canada) en décembre 1901. La radio est née, et avec elle la communication moderne.",
    suite:
      "La voix de l'observatoire de la mer propose un rendez-vous au printemps : leurs équipes, leurs cartes, leurs machines. Le voyage sera long, mais Inès sourit en refermant le Carnet. Un jour, elle y écrira la dernière ligne : « Le projet Graine est devenu une forêt. »",
  },
]
