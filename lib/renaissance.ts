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
  science: { titre: string; texte: string[]; formule?: string; schema?: string }[]   // 1 à 3 encadrés
  // schema : identifiant d'un schéma de app/etudes/SchemasGraine.tsx
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

// Les vingt-quatre chapitres, du plus simple au plus avancé
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
        schema: "filtre-eau",
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
        schema: "triangle-feu",
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
        schema: "gnomon",
        texte: [
          "Le Soleil semble traverser le ciel parce que la Terre tourne sur elle-même : un tour complet de 360° en 24 heures, soit 15° par heure. Un bâton vertical, appelé gnomon, projette une ombre qui tourne comme l'aiguille d'une horloge.",
          "En Suisse (hémisphère nord), à midi solaire, le Soleil est exactement au sud et l'ombre est la plus courte, pointant vers le nord. Marquer le bout de l'ombre plusieurs fois dans la journée suffit pour tracer une ligne nord-sud.",
        ],
        formule: "angle parcouru = 15° × nombre d'heures",
      },
      {
        titre: "L'étoile Polaire et la latitude",
        schema: "etoile-polaire",
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
        schema: "triangle-345",
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
        schema: "levier",
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
        schema: "triangles-semblables",
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
        schema: "cycle-chaux",
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
        schema: "molecule-savon",
        texte: [
          "Une molécule de savon a une « tête » hydrophile (qui aime l'eau) et une « queue » hydrophobe (qui fuit l'eau mais s'accroche à la graisse). Dans l'eau savonneuse, les queues entourent les gouttes de graisse, les têtes restent tournées vers l'eau : la graisse est emportée au rinçage.",
          "Le savon se forme par une réaction appelée saponification : une graisse réagit avec une base forte pour donner du savon et de la glycérine. Cette réaction utilise des produits dangereux, c'est pourquoi on ne la tente pas sans formation.",
        ],
      },
      {
        titre: "L'échelle du pH",
        schema: "echelle-ph",
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
        schema: "croissance-levure",
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
        schema: "lentille",
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
        schema: "reduction-fer",
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
        schema: "pile-volta",
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
        schema: "induction",
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
        schema: "piston",
        texte: [
          "La pression est la force exercée sur une surface : P = F / S. L'unité est le pascal (Pa), égal à 1 newton par mètre carré. La pression atmosphérique au niveau de la mer vaut environ 100 000 Pa (1 bar).",
          "Plus la surface est grande, plus la même pression produit une force importante. Dans une cocotte-minute, la pression augmente et l'eau ne bout qu'à plus de 100 °C : la cuisson est plus rapide. Cette hausse de la température d'ébullition avec la pression est exploitée par les machines à vapeur.",
        ],
        formule: "P = F / S   donc   F = P × S",
      },
      {
        titre: "Rendement et limite de Carnot",
        schema: "machine-thermique",
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
        schema: "onde",
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

  // 17. Statistiques : le grenier commun
  {
    id: "recoltes",
    numero: 17,
    titre: "Le grenier commun",
    matieres: ["Maths", "Biologie"],
    niveau: 3,
    recit: [
      "Au printemps, un convoi arrive à la Combe : une douzaine de silhouettes fatiguées, un chariot chargé de caisses, et une femme au regard vif qui se présente : « Soline, ingénieure de l'Observatoire de la mer. Nous avons marché neuf jours sur votre signal. » Anselme ouvre les bras, Maëlle apporte de l'eau chaude. Pour la première fois depuis le réveil, il y a plus de monde que de bols.",
      "Mais la joie dure jusqu'au premier repas. Douze bouches de plus à nourrir, et le grenier de la Combe est à moitié vide. Anselme pose sur la table cinq sacs de blé, un par champ, et ils ne pèsent pas pareil. « Le champ du haut a donné soixante-deux kilos, celui du bas trente-huit. Alors, on partage comment ? » Les voix montent. Mathis lâche son « Prouve-le » : « Prouve-moi que le champ du haut est meilleur, et pas juste chanceux cette année. »",
      "Inès sort le Carnet et trace cinq barres dans la poussière, une par champ. « Pour comparer, on résume. La moyenne : on additionne tout et on divise par le nombre de champs. » Elle calcule en silence. « Cinquante kilos par champ. Mais deux champs sont loin de cinquante. Il faut aussi mesurer à quel point les récoltes s'écartent de la moyenne. Cela s'appelle l'écart-type. »",
      "Soline hoche la tête : « À l'Observatoire, on a appris ce que ça veut dire à nos dépens. Une année, tous les champs étaient proches de la moyenne et tout allait bien. L'année suivante, la grêle a frappé un seul versant : la moyenne a baissé, mais surtout l'écart a explosé. » Pour savoir quelle réserve garder en prévision des mauvaises années, il faut les deux nombres. Le groupe se met au calcul, un bol de soupe à la main, pendant que dehors le ciel se couvre d'un gris inquiétant.",
    ],
    science: [
      {
        titre: "Moyenne et médiane",
        texte: [
          "La moyenne se calcule en additionnant toutes les valeurs, puis en divisant par leur nombre. Elle résume une série par un seul nombre « typique ».",
          "La médiane est la valeur du milieu quand on range les nombres du plus petit au plus grand : la moitié des valeurs est en dessous, l'autre moitié au-dessus. Contrairement à la moyenne, elle bouge à peine si une valeur est extrême (une récolte détruite par la grêle, par exemple).",
        ],
        formule: "moyenne = (x₁ + x₂ + … + xₙ) / n",
      },
      {
        titre: "L'écart-type : mesurer la dispersion",
        schema: "histogramme-recoltes",
        texte: [
          "Deux séries peuvent avoir la même moyenne et être très différentes : 49, 50, 51 et 20, 50, 80 ont toutes deux 50 pour moyenne. L'écart-type mesure la dispersion : plus il est grand, plus les valeurs sont éloignées de la moyenne.",
          "On calcule l'écart de chaque valeur à la moyenne, on met ces écarts au carré, on fait leur moyenne (c'est la variance), puis on prend la racine carrée pour revenir à la même unité que les données.",
        ],
        formule: "σ = √( Σ (xᵢ − m)² / n )",
      },
    ],
    experience:
      "Prends un dé et lance-le 20 fois en notant chaque résultat. Calcule la moyenne (elle devrait être proche de 3,5), puis trouve la médiane en rangeant les résultats du plus petit au plus grand. Recommence avec 20 autres lancers : la moyenne change un peu d'une série à l'autre. Plus tu lances, plus elle se rapproche de 3,5.",
    defis: [
      {
        type: "nombre",
        question: "Les cinq champs ont donné 38, 46, 50, 54 et 62 kg. Quelle est la récolte moyenne par champ, en kg ?",
        reponse: 50,
        tolerance: 0.01,
        unite: "kg",
        indice: "Additionne les cinq valeurs, puis divise par 5.",
        solution: ["Somme : 38 + 46 + 50 + 54 + 62 = 250 kg", "Moyenne : 250 / 5 = 50 kg"],
      },
      {
        type: "nombre",
        question: "Calcule l'écart-type, en kg, de la série 38, 46, 50, 54 et 62 kg (de moyenne 50 kg).",
        reponse: 8,
        tolerance: 0.01,
        unite: "kg",
        indice: "Écarts à la moyenne, au carré, puis moyenne de ces carrés, puis racine carrée.",
        solution: [
          "Écarts à la moyenne : −12, −4, 0, +4, +12",
          "Carrés : 144, 16, 0, 16, 144 ; leur somme vaut 320",
          "Variance : 320 / 5 = 64",
          "Écart-type : √64 = 8 kg",
        ],
      },
      {
        type: "nombre",
        question: "Sept familles ont mis en réserve 12, 7, 9, 15, 4, 11 et 8 sacs. Quelle est la médiane de cette série ?",
        reponse: 9,
        tolerance: 0.01,
        indice: "Range d'abord les nombres dans l'ordre croissant, puis prends celui du milieu.",
        solution: [
          "Dans l'ordre : 4, 7, 8, 9, 11, 12, 15",
          "Il y a 7 valeurs : la médiane est la 4e, soit 9 sacs.",
        ],
      },
      {
        type: "choix",
        question:
          "Deux villages ont la même récolte moyenne de 50 kg par champ. L'écart-type vaut 2 kg dans le premier et 15 kg dans le second. Lequel court le plus de risques de manquer de blé une mauvaise année ?",
        options: [
          "Le premier, car son écart-type est plus petit",
          "Le second, car ses récoltes sont très irrégulières",
          "Aucun, car la moyenne est la même",
          "Impossible à savoir sans connaître les noms des champs",
        ],
        bonne: 1,
        indice: "Un grand écart-type veut dire des champs très différents : certains très mauvais.",
        solution: [
          "La moyenne est la même, mais pas la dispersion.",
          "Avec un écart-type de 15 kg, certains champs peuvent donner bien moins que 50 kg : le risque de mauvaise année est plus grand.",
          "Le premier village a des récoltes régulières, donc plus prévisibles.",
        ],
      },
    ],
    enVrai:
      "À partir des années 1850, l'infirmière britannique Florence Nightingale utilise des diagrammes statistiques pour montrer que, pendant la guerre de Crimée, la plupart des soldats meurent de maladies et non de blessures. Ses graphiques convainquent le gouvernement d'améliorer l'hygiène des hôpitaux. Dès les années 1830, le Belge Adolphe Quetelet appliquait la moyenne aux mesures humaines avec son idée d'« homme moyen ». Et c'est en 1893 que le mathématicien britannique Karl Pearson introduit le terme « écart type » (standard deviation).",
    suite:
      "Le soir, alors que le conseil vote enfin un partage, Anselme dépose sur la table un sachet de pois séchés : certains ronds comme des perles, d'autres fripés comme de petits cerveaux. « Mon grand-père disait que ces pois cachent un secret. Les parents sont ronds, et pourtant les petits sortent parfois ridés. Expliquez-moi ça, les savants. »",
  },

  // 18. Génétique : les pois d'Anselme
  {
    id: "genetique",
    numero: 18,
    titre: "Les pois d'Anselme",
    matieres: ["Biologie", "Maths"],
    niveau: 3,
    recit: [
      "Le lendemain, Lina et Anselme s'installent dans le potager avec le sachet de pois. Elle les trie sur un drap : les ronds à gauche, les ridés à droite. « Si je plante deux pois ronds, je devrais obtenir des pois ronds, non ? » — « Pas toujours, répond Anselme avec un sourire en coin. Ça fait des générations que je le vois. »",
      "Mathis, bien sûr, refuse de croire sans preuve. Lina décide donc de mener l'enquête : d'abord isoler des lignées pures, c'est-à-dire des plants qui, croisés entre eux, donnent toujours des pois ronds, ou toujours des pois ridés. Puis les croiser. Il faudra attendre la récolte, et Sève rappelle dans un grésillement qu'un homme avait fait exactement cela il y a très longtemps.",
      "Quelques semaines plus tard, premier résultat : tous les pois de la première génération sont ronds. Pas un seul ridé ! Mathis triomphe un instant : « Donc les ridés n'existent plus. » Lina sourit et plante ces pois ronds ensemble. La deuxième génération pousse. Quand les gousses s'ouvrent, tout le monde se penche. Sur 200 pois, des ridés sont revenus. Un quart environ.",
      "Inès comprend la première : chaque pois porte deux exemplaires de l'information, un venant de chaque parent. Le « rond » (R) l'emporte sur le « ridé » (r) quand les deux sont présents. Un pois Rr paraît rond, mais peut transmettre r. Elle dessine un tableau de quatre cases. « Si les deux parents sont Rr, il y a quatre combinaisons possibles, toutes aussi probables. » Un silence. Puis Mathis murmure : « Trois sur quatre... et un sur quatre. Ça colle. »",
    ],
    science: [
      {
        titre: "Gènes, allèles, dominant et récessif",
        texte: [
          "Chaque être vivant possède, pour un caractère donné (la forme d'un pois, par exemple), deux versions du gène appelées allèles : une venue de chaque parent. Un allèle dominant (noté R) s'exprime même s'il est présent en un seul exemplaire ; un allèle récessif (noté r) ne s'exprime que s'il est présent en deux exemplaires.",
          "Un pois RR et un pois Rr sont donc tous deux ronds, mais seul rr est ridé. Un individu Rr est « porteur » : il cache un allèle qu'il peut transmettre à ses descendants.",
        ],
      },
      {
        titre: "Probabilités et carré de Punnett",
        schema: "carre-punnett",
        texte: [
          "Une probabilité est un nombre entre 0 et 1 (ou entre 0 % et 100 %). Quand tous les cas sont aussi probables, P = cas favorables / cas possibles. Pour deux événements indépendants (qui ne s'influencent pas), on multiplie leurs probabilités.",
          "Le carré de Punnett est un tableau qui liste tous les croisements possibles des cellules reproductrices. Pour Rr × Rr : RR, Rr, Rr, rr. Chaque case a une probabilité de 1/4 : on obtient donc 3/4 de pois ronds et 1/4 de pois ridés.",
        ],
        formule: "P = cas favorables / cas possibles",
      },
    ],
    experience:
      "Prends deux pièces de monnaie, une pour chaque parent « Rr » : pile = R, face = r. Lance les deux pièces ensemble 40 fois et note à chaque fois si le pois est « rond » (au moins un pile) ou « ridé » (deux faces). Après 40 lancers, tu obtiens environ 30 pois ronds et 10 ridés. Plus tu lances, plus tu te rapproches de 3 sur 4.",
    defis: [
      {
        type: "nombre",
        question: "On croise deux pois Rr. Quelle est la probabilité, en pourcentage, que le descendant soit ridé (rr) ?",
        reponse: 25,
        tolerance: 0.01,
        unite: "%",
        indice: "Dans le carré de Punnett, combien de cases sur 4 sont rr ?",
        solution: ["Le carré donne RR, Rr, Rr, rr.", "Une case sur quatre est rr : 1/4 = 25 %."],
      },
      {
        type: "nombre",
        question: "On sème 200 graines issues d'un croisement Rr × Rr. Combien de pois ronds peut-on attendre environ ?",
        reponse: 150,
        tolerance: 0.01,
        indice: "Les pois ronds représentent 3/4 des descendants (RR et Rr).",
        solution: ["Part des ronds : 3/4 = 0,75", "200 × 0,75 = 150 pois ronds (et 50 ridés)."],
      },
      {
        type: "nombre",
        question:
          "On tire au hasard deux descendants de ce croisement. Quelle est la probabilité, en pourcentage, que les deux soient ridés ? (les tirages sont indépendants)",
        reponse: 6.25,
        tolerance: 0.01,
        unite: "%",
        indice: "Probabilité d'un pois ridé : 1/4. Pour deux événements indépendants, on multiplie.",
        solution: ["P = 1/4 × 1/4 = 1/16", "1/16 = 0,0625, soit 6,25 %."],
      },
      {
        type: "choix",
        question: "On croise un pois RR (rond, lignée pure) avec un pois rr (ridé, lignée pure). Que sont les descendants de la première génération ?",
        options: ["Tous ridés", "Tous ronds (Rr)", "La moitié ronds, la moitié ridés", "Ni ronds ni ridés"],
        bonne: 1,
        indice: "Le parent RR donne toujours R, le parent rr donne toujours r. Quel allèle domine ?",
        solution: [
          "Chaque descendant reçoit R d'un parent et r de l'autre : il est Rr.",
          "R est dominant : tous les descendants sont ronds.",
          "L'allèle r est caché, mais il réapparaîtra à la génération suivante.",
        ],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : ne mange jamais de graines de semence du commerce, souvent traitées avec des produits toxiques, ni de plantes que tu ne connais pas parfaitement.",
    enVrai:
      "Entre 1856 et 1863, le moine et botaniste Gregor Mendel cultive des dizaines de milliers de plants de pois dans le jardin de son monastère de Brünn (aujourd'hui Brno, en Tchéquie). Il compte soigneusement : pour la forme des graines, il obtient à la deuxième génération 5 474 pois ronds et 1 850 ridés, soit un rapport proche de 3 pour 1. Il publie ses résultats en 1866, mais personne n'en saisit la portée. Ce n'est qu'en 1900 que trois botanistes, Hugo de Vries, Carl Correns et Erich von Tschermak, redécouvrent ses lois, bien après la mort de Mendel en 1884.",
    suite:
      "Les récoltes s'annoncent bonnes. Soline, elle, ne dit presque rien depuis trois jours. Elle étale devant Inès une carte jaunie de l'Observatoire. « Cette carte est fausse, dit-elle. Les rivières ne coulent plus où elles étaient dessinées, et il manque une vallée entière. Pour rejoindre vos voisins du sud, il faut la refaire. »",
  },

  // 19. Cartographie : dessiner le pays
  {
    id: "cartes",
    numero: 19,
    titre: "Dessiner le pays",
    matieres: ["Maths"],
    niveau: 3,
    recit: [
      "Soline déploie sa carte sur la table : des lignes tremblantes, des noms effacés, une échelle presque illisible dans un coin. « Mon père me l'a donnée avant de mourir. Elle montre trois communautés au sud : un moulin, une forge, un village de pêcheurs. Mais la rivière ici n'existe plus... » Basile pose son doigt sur une tache : « Et ça, c'est quoi ? » — « Peut-être une vallée. Peut-être un bol de soupe renversé. »",
      "Inès comprend qu'on ne peut pas se lancer sans carte fiable. Mais comment mesurer un pays entier ? « On ne mesure pas tout. On mesure quelques distances et quelques angles, puis on calcule le reste. » Elle plante deux piquets sur la berge, à cent mètres l'un de l'autre. De l'autre côté de l'eau, un grand chêne.",
      "Basile vise le chêne depuis chaque piquet avec une planchette graduée. Les deux visées forment deux angles avec la ligne qui relie les piquets. Mathis plisse les yeux : « Tu ne peux pas connaître la distance sans traverser. » — « Si, répond Inès. Un côté et deux angles déterminent un triangle entier. Il n'existe qu'un seul triangle possible. »",
      "Elle trace ensuite le triangle sur une feuille, en réduisant tout dans la même proportion : un centimètre sur le papier pour dix mètres sur le terrain. « Voilà une échelle. Si je garde la même pour toutes les distances, la carte sera juste. » Soline sourit pour la première fois depuis son arrivée. Sur la carte neuve, trois croix apparaissent. La route du sud est enfin tracée, et elle passe le doigt dessus comme on caresse un animal.",
    ],
    science: [
      {
        titre: "L'échelle d'une carte",
        texte: [
          "L'échelle d'une carte est le rapport entre une longueur sur la carte et la longueur réelle correspondante, exprimées dans la même unité. Une échelle de 1 : 25 000 signifie que 1 cm sur la carte représente 25 000 cm sur le terrain, soit 250 m.",
          "C'est de la proportionnalité : si on double la distance sur la carte, on double la distance réelle. Plus le nombre après les deux-points est petit (1 : 10 000), plus la carte est détaillée ; plus il est grand (1 : 100 000), plus elle couvre de territoire avec peu de détails.",
        ],
        formule: "distance réelle = distance sur la carte × dénominateur de l'échelle",
      },
      {
        titre: "La triangulation",
        schema: "triangulation",
        texte: [
          "Pour mesurer une distance qu'on ne peut pas parcourir, on mesure une base (une distance accessible) et deux angles vers la cible. Un côté et deux angles suffisent à fixer un triangle.",
          "Si l'on vise un point P depuis deux points A et B, avec des angles α et β à la base AB de longueur d, la hauteur h du triangle (la distance perpendiculaire de P à la base) vaut h = d × tan α × tan β / (tan α + tan β). Avec α = β = 45°, tan 45° = 1 et h = d / 2.",
        ],
        formule: "h = d × tan α × tan β / (tan α + tan β)",
      },
    ],
    experience:
      "Mesure la longueur et la largeur d'une pièce de ta maison avec un mètre, puis dessine son plan sur une feuille quadrillée à l'échelle 1 : 50 (1 cm sur le papier pour 50 cm dans la pièce). Une pièce de 4 m sur 3 m devient un rectangle de 8 cm sur 6 cm. Place ensuite les meubles à la même échelle.",
    defis: [
      {
        type: "nombre",
        question: "Sur la carte de Soline, l'échelle est de 1 : 25 000. Deux villages sont séparés de 8 cm. Quelle est la distance réelle, en kilomètres ?",
        reponse: 2,
        tolerance: 0.01,
        unite: "km",
        indice: "Multiplie par 25 000, puis convertis les centimètres en kilomètres (1 km = 100 000 cm).",
        solution: ["8 × 25 000 = 200 000 cm", "200 000 cm = 2 000 m = 2 km"],
      },
      {
        type: "nombre",
        question: "La route du sud mesure 7,5 km. Quelle longueur dessine-t-on, en centimètres, sur une carte à l'échelle 1 : 50 000 ?",
        reponse: 15,
        tolerance: 0.01,
        unite: "cm",
        indice: "Convertis 7,5 km en centimètres, puis divise par 50 000.",
        solution: ["7,5 km = 750 000 cm", "750 000 / 50 000 = 15 cm"],
      },
      {
        type: "nombre",
        question:
          "Inès plante deux piquets distants de 100 m. Depuis chacun, l'angle de visée vers le chêne, avec la ligne des piquets, est de 45°. À quelle distance perpendiculaire de cette ligne se trouve le chêne, en mètres ?",
        reponse: 50,
        tolerance: 0.01,
        unite: "m",
        indice: "h = d × tan α × tan β / (tan α + tan β), avec tan 45° = 1.",
        solution: ["h = 100 × 1 × 1 / (1 + 1)", "h = 100 / 2 = 50 m"],
      },
      {
        type: "choix",
        question: "Quelle carte montre le plus de détails sur une petite zone ?",
        options: ["1 : 1 000 000", "1 : 100 000", "1 : 10 000", "Toutes autant"],
        bonne: 2,
        indice: "Plus le dénominateur est petit, moins on réduit la réalité.",
        solution: [
          "Sur une carte au 1 : 10 000, 1 cm représente 100 m.",
          "Sur une carte au 1 : 1 000 000, 1 cm représente 10 km.",
          "La première montre donc beaucoup plus de détails sur une petite zone.",
        ],
      },
    ],
    enVrai:
      "En 1617, le Néerlandais Willebrord Snellius mesure la distance entre deux villes de son pays en enchaînant des triangles dont il mesure les angles : c'est l'une des premières grandes applications de la triangulation. Au XVIIIe siècle, la famille Cassini réalise la première carte générale de France fondée sur cette méthode (publiée de 1756 à 1789). Entre 1792 et 1798, Delambre et Méchain mesurent l'arc de méridien entre Dunkerque et Barcelone pour définir le mètre. En Suisse, le général Guillaume-Henri Dufour dirige de 1845 à 1865 la première carte topographique du pays entier, au 1 : 100 000.",
    suite:
      "Avec la carte neuve, les messagers partent vers le sud. Trois semaines plus tard, des marchands de la forge et du moulin arrivent à la Combe. Ils veulent du blé ; on leur propose des lentilles. Ils veulent des poules ; on leur offre des outils. La dispute éclate : personne ne s'entend sur ce que « vaut » chaque chose. Anselme se gratte la barbe : « Il nous faudrait une langue commune pour les prix. »",
  },

  // 20. Économie : le prix des choses
  {
    id: "monnaie",
    numero: 20,
    titre: "Le prix des choses",
    matieres: ["Maths"],
    niveau: 3,
    recit: [
      "Le marché improvisé de la Combe est un joyeux désordre. Tobias, un forgeron venu du sud, veut du blé. Maëlle lui propose des herbes séchées. « Je n'ai pas besoin d'herbes, j'ai besoin de blé ! » De l'autre côté, les pêcheurs veulent des couteaux, mais le forgeron veut du poisson... seulement le mardi.",
      "Basile compte sur ses doigts : trois poules valent deux sacs de blé, un sac de blé vaut six pots de miel, mais du miel, personne n'en veut cette semaine. Chaque échange exige que chacun possède exactement ce que l'autre désire : le troc devient un casse-tête. Mathis soupire : « Pourquoi pas une chose que tout le monde accepte et qu'on pourrait échanger contre n'importe quoi ? »",
      "Inès sort une poignée de jetons d'argile cuits au four de Basile, tous marqués d'un trait. « Une monnaie. Un jeton est une unité de valeur : une poule vaut quatre jetons, un sac de blé six. » Mathis objecte : « Et si quelqu'un fabrique mille jetons en cachette ? » Silence. « Alors ils ne vaudront plus rien, répond Inès. Une monnaie ne marche que si les jetons restent rares, et si tout le monde y croit. »",
      "Soline, qui tenait l'économat de l'Observatoire, explique un second principe : quand le blé est rare et que beaucoup de gens en veulent, son prix monte ; quand il y en a trop, il baisse. Le groupe fixe un prix d'essai et note chaque jour combien de sacs sont offerts et demandés. Peu à peu, le prix glisse vers un point où personne ne repart avec des sacs invendus ni les mains vides.",
      "Reste une question que pose Lina : un voisin veut emprunter mille jetons pour acheter une meule. Combien doit-il rendre dans trois ans ? On convient d'un intérêt de 5 % par an. Mais Mathis fait le calcul et lève un sourcil : « Ce n'est pas 150 jetons de plus. C'est un peu plus. » Pourquoi ?",
    ],
    science: [
      {
        titre: "Troc, monnaie et valeur",
        texte: [
          "Dans le troc, on échange un bien contre un autre : il faut que chacun veuille exactement ce que l'autre offre. Une monnaie règle le problème en servant de moyen d'échange, d'unité de compte (on exprime tous les prix avec elle) et de réserve de valeur (on peut la garder pour plus tard).",
          "Une bonne monnaie est reconnue de tous, facile à transporter, divisible et difficile à falsifier. Si on en fabrique beaucoup sans produire plus de biens, les prix montent : c'est l'inflation.",
        ],
      },
      {
        titre: "Offre, demande et prix d'équilibre",
        schema: "offre-demande",
        texte: [
          "La demande est la quantité que les acheteurs veulent acheter : elle diminue quand le prix monte. L'offre est la quantité que les producteurs veulent vendre : elle augmente quand le prix monte.",
          "Le prix d'équilibre est celui où l'offre égale la demande : il n'y a ni invendus ni pénurie. Si le prix est trop haut, des invendus restent et le prix baisse ; s'il est trop bas, la pénurie le fait monter.",
        ],
        formule: "offre = demande",
      },
      {
        titre: "Les intérêts composés",
        texte: [
          "Un intérêt est le prix à payer pour emprunter de l'argent. Avec des intérêts composés, les intérêts d'une année sont ajoutés au capital, et rapportent à leur tour des intérêts l'année suivante.",
          "Pour un capital C placé au taux t (en écriture décimale : 5 % = 0,05) pendant n années, le montant final est C × (1 + t)ⁿ. C'est une croissance exponentielle, comme celle des levures.",
        ],
        formule: "C_final = C × (1 + t)ⁿ",
      },
    ],
    experience:
      "Organise un petit marché en famille ou entre amis : chacun reçoit 10 jetons (des haricots secs) et quelques objets à vendre (bonbons, images). Fixez les prix, échangez, puis changez le prix d'un objet très demandé et observe comment les ventes évoluent. Tu viens de faire de l'économie !",
    defis: [
      {
        type: "nombre",
        question: "Un voisin emprunte 1 000 jetons à 5 % d'intérêts composés par an. Combien doit-il rendre au bout de 3 ans, en jetons (arrondi à l'unité) ?",
        reponse: 1158,
        tolerance: 0.01,
        unite: "jetons",
        indice: "Multiplie le capital par 1,05 pour chaque année, donc par 1,05³.",
        solution: [
          "C_final = 1 000 × 1,05³",
          "1,05³ = 1,157625",
          "C_final ≈ 1 157,6, soit 1 158 jetons (et non 1 150 : les intérêts rapportent des intérêts).",
        ],
      },
      {
        type: "nombre",
        question: "Un sac de blé vaut 1,5 poule (2 sacs valent 3 poules) et une poule vaut 4 jetons. Combien de jetons valent 5 sacs de blé ?",
        reponse: 30,
        tolerance: 0.01,
        unite: "jetons",
        indice: "Trouve d'abord la valeur d'un sac en jetons.",
        solution: ["1 sac = 1,5 poule = 1,5 × 4 = 6 jetons", "5 sacs = 5 × 6 = 30 jetons"],
      },
      {
        type: "nombre",
        question:
          "Sur le marché, la demande est Qd = 200 − 20 p et l'offre Qs = 40 + 20 p (p = prix d'un sac en jetons). Quel est le prix d'équilibre, en jetons ?",
        reponse: 4,
        tolerance: 0.01,
        unite: "jetons",
        indice: "À l'équilibre, offre = demande : résous 200 − 20 p = 40 + 20 p.",
        solution: [
          "200 − 20 p = 40 + 20 p",
          "160 = 40 p, donc p = 4 jetons",
          "Vérification : demande 200 − 80 = 120 et offre 40 + 80 = 120 sacs.",
        ],
      },
      {
        type: "choix",
        question: "Une sécheresse détruit une partie des récoltes de blé (l'offre diminue) alors que la demande reste la même. Que devient le prix du blé ?",
        options: ["Il baisse", "Il monte", "Il ne change pas", "Il devient nul"],
        bonne: 1,
        indice: "Il y a moins de blé pour autant d'acheteurs.",
        solution: [
          "Quand l'offre diminue, le blé devient plus rare.",
          "Les acheteurs sont prêts à payer plus pour en obtenir : le prix monte.",
        ],
      },
    ],
    enVrai:
      "Les premières pièces de monnaie connues apparaissent en Lydie (dans l'actuelle Turquie) vers 600 av. J.-C., en électrum, un alliage naturel d'or et d'argent. Bien avant, des sociétés utilisaient des coquillages, du sel ou des lingots. En 1683, le mathématicien bâlois Jacques Bernoulli étudie les intérêts composés et rencontre au passage le nombre e. En 1776, l'économiste écossais Adam Smith publie « La Richesse des nations » et décrit comment les prix naissent de la rencontre de l'offre et de la demande.",
    suite:
      "Le marché prospère, et le blé afflue : des centaines de sacs à moudre. Moudre à bras prend des journées entières et use les épaules. Basile regarde le torrent qui dévale la pente sous la Combe, mousseux et indifférent. « Pourquoi ce n'est pas lui qui travaille à notre place ? »",
  },

  // 21. Énergie hydraulique : la roue du torrent
  {
    id: "hydraulique",
    numero: 21,
    titre: "La roue du torrent",
    matieres: ["Physique", "Maths"],
    niveau: 3,
    recit: [
      "Le torrent de la Combe dévale la pente, bruyant, glacé, indifférent. Basile passe des heures assis au bord, à lancer des brindilles et à les regarder filer. « Il y a de l'énergie là-dedans, répète-t-il. Je la sens. Je ne sais juste pas encore la compter. »",
      "Avec Soline, il construit une première roue à aubes en planches de mélèze. L'eau, détournée par un petit canal, tombe d'une hauteur de plusieurs mètres sur les pales. La roue grince, hésite, puis se met à tourner dans un ronronnement régulier. Les enfants applaudissent. Mathis, lui, demande combien de blé elle moudra par jour. Personne ne sait répondre.",
      "Inès s'accroupit près du canal. « Pour savoir ce qu'elle peut fournir, il faut savoir combien d'énergie l'eau libère. Une masse m située à une hauteur h possède une énergie potentielle E = m × g × h. En tombant, l'eau la cède à la roue. » Elle fait le calcul pour un mètre cube, mille kilos d'eau qui tombent de cinq mètres, et le résultat la fait siffler.",
      "Mais ce qui compte pour une machine, c'est l'énergie fournie chaque seconde : la puissance. « Deux cents kilos d'eau par seconde, ça donne combien ? » demande Basile. Inès calcule, puis tempère : aucune roue ne récupère toute l'énergie. Une partie se perd en éclaboussures, en fuites et en frottements. Il faudra mesurer le rendement.",
      "Cette nuit-là, un orage éclate sur la montagne. Vers minuit, un bruit sourd réveille le camp : le torrent gonflé charrie des troncs, des pierres, de la boue. Basile court dans le noir vers le canal, une lanterne à la main. Il tire la vanne de bois de toutes ses forces, juste avant qu'un tronc ne percute la roue. La structure tremble... et tient.",
    ],
    science: [
      {
        titre: "L'énergie potentielle de pesanteur",
        schema: "moulin-eau",
        texte: [
          "Un objet de masse m situé à la hauteur h possède une énergie potentielle de pesanteur E = m × g × h, en joules (J), avec m en kg, h en m et g = 9,81 N/kg. En tombant, cette énergie se transforme en énergie de mouvement, que la roue récupère.",
          "Doubler la hauteur de chute double l'énergie disponible ; doubler la masse d'eau aussi.",
        ],
        formule: "E = m × g × h",
      },
      {
        titre: "Puissance et rendement",
        texte: [
          "La puissance est l'énergie fournie par seconde : P = E / t, en watts (W). Un watt, c'est un joule par seconde. Pour un débit de q kilos d'eau par seconde qui tombent de la hauteur h, la puissance théorique est P = q × g × h.",
          "Le rendement η est le rapport entre la puissance utile et la puissance reçue. Une bonne roue à aubes a un rendement de l'ordre de 50 à 70 % : le reste est perdu en frottements, éclaboussures et fuites.",
        ],
        formule: "P = E / t   et   η = P_utile / P_reçue",
      },
    ],
    experience:
      "Avec un adulte, plante quatre cuillères en plastique autour d'un bouchon de grand flacon, traverse-le d'une baguette en bois posée sur deux supports, et place cette petite roue sous un robinet qui coule doucement, au-dessus de l'évier. Observe comment sa vitesse change quand tu la rapproches ou l'éloignes du robinet : plus l'eau tombe de haut, plus la roue tourne vite.",
    defis: [
      {
        type: "nombre",
        question: "Un mètre cube d'eau (1 000 kg) tombe d'une hauteur de 5 m. Quelle énergie libère-t-il, en joules ? (g = 9,81 N/kg)",
        reponse: 49050,
        tolerance: 0.01,
        unite: "J",
        indice: "E = m × g × h.",
        solution: ["E = 1 000 × 9,81 × 5", "E = 49 050 J, soit environ 49 kJ."],
      },
      {
        type: "nombre",
        question: "Le torrent fournit 200 kg d'eau par seconde sur une chute de 5 m. Quelle est la puissance théorique, en watts ? (g = 9,81 N/kg)",
        reponse: 9810,
        tolerance: 0.01,
        unite: "W",
        indice: "En une seconde, 200 kg tombent : P = q × g × h.",
        solution: ["P = 200 × 9,81 × 5", "P = 9 810 W, soit environ 9,8 kW."],
      },
      {
        type: "nombre",
        question: "La roue a un rendement de 60 %. Avec la puissance théorique de 9 810 W, quelle puissance utile fournit-elle, en watts ?",
        reponse: 5886,
        tolerance: 0.01,
        unite: "W",
        indice: "Puissance utile = rendement × puissance reçue (60 % = 0,6).",
        solution: ["P_utile = 0,6 × 9 810", "P_utile = 5 886 W, soit environ 5,9 kW."],
      },
      {
        type: "choix",
        question: "On double la hauteur de chute en gardant le même débit d'eau. Que devient la puissance théorique ?",
        options: ["Elle reste la même", "Elle double", "Elle est multipliée par 4", "Elle est divisée par 2"],
        bonne: 1,
        indice: "Dans P = q × g × h, la hauteur h est un simple facteur.",
        solution: [
          "P = q × g × h est proportionnelle à h.",
          "Si h double, P double aussi.",
        ],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : ne t'approche jamais seul(e) d'un torrent, d'un canal ou d'une roue en mouvement. Même un courant faible peut te faire tomber, et une roue peut écraser. Ne construis rien au bord d'un cours d'eau sans adulte expérimenté.",
    enVrai:
      "Les Romains décrivent des moulins à eau dès le Ier siècle av. J.-C. (l'ingénieur Vitruve en parle). Près d'Arles, le site de Barbegal (IIe siècle ap. J.-C.) alignait seize roues sur une pente. Au Moyen Âge, le Domesday Book, enquête menée en 1086, recense plus de 5 600 moulins à eau en Angleterre. Vers 1830, le Français Benoît Fourneyron met au point une turbine hydraulique efficace, et en 1882 la première centrale hydroélectrique entre en service à Appleton, dans le Wisconsin (États-Unis).",
    suite:
      "Au retour du calme, le ciel se dégage, d'une pureté stupéfiante. Soline sort de ses caisses deux lentilles polies, une grande et une petite. « À l'Observatoire, on regarde le ciel depuis toujours. Ce soir, on va le regarder de plus près. »",
  },

  // 22. Optique : les lunes de Jupiter
  {
    id: "jupiter",
    numero: 22,
    titre: "Les lunes de Jupiter",
    matieres: ["Physique", "Maths"],
    niveau: 4,
    recit: [
      "Le ciel, après l'orage, est d'une pureté qu'Inès n'avait jamais vue : pas une lumière à des kilomètres, des milliers d'étoiles. Soline étale sur la table deux lentilles polies, l'une large comme une assiette à dessert, l'autre petite comme une bille. « À l'Observatoire, on les garde depuis toujours. Mais on n'a jamais eu le tube pour les assembler. »",
      "Basile creuse un long tube dans du bois de tilleul et le noircit à l'intérieur avec de la suie pour éviter les reflets. La grande lentille d'un côté, c'est l'objectif ; la petite de l'autre, c'est l'oculaire. Après plusieurs essais pour régler la distance qui les sépare, Mathis colle son œil à l'oculaire et reste silencieux, la bouche ouverte. « La Lune..., dit-il enfin. Elle a des cratères. »",
      "Soline tourne alors la lunette vers un point très brillant qui ne scintille pas. « Jupiter. » Autour de la planète, quatre petits points alignés. Inès note leur position dans le Carnet. Le lendemain soir, elle recommence : les points ont changé de place, l'un a même disparu. « Ils bougent..., souffle-t-elle. Ils tournent autour de Jupiter. » Un autre monde, avec ses propres lunes.",
      "Mathis, qui n'a plus de « Prouve-le » à opposer, en trouve un autre : « Et si quelqu'un voulait vérifier ça sans lunette ? » Soline sourit : « Quelqu'un a fait mieux. Il a utilisé ces lunes pour mesurer la vitesse de la lumière. » Inès calcule la distance de Jupiter, la divise par 300 000 km/s, et pâlit : la lumière qu'elle voit est partie il y a plus d'une demi-heure. Elle regarde dans le passé.",
    ],
    science: [
      {
        titre: "La lunette astronomique",
        schema: "lunette",
        texte: [
          "Une lunette astronomique associe deux lentilles convergentes : l'objectif, de grand diamètre et de grande distance focale, forme une petite image de l'astre ; l'oculaire, de petite distance focale, sert de loupe pour agrandir cette image.",
          "Le grossissement vaut G = f_objectif / f_oculaire. Mais le plus important est la quantité de lumière captée : elle est proportionnelle à l'aire de l'objectif, donc au carré de son diamètre. Doubler le diamètre, c'est capter quatre fois plus de lumière.",
        ],
        formule: "G = f_objectif / f_oculaire",
      },
      {
        titre: "La vitesse finie de la lumière",
        texte: [
          "La lumière voyage très vite, mais pas instantanément : c ≈ 300 000 km/s. La lumière du Soleil met environ 8 minutes à nous parvenir, celle de Jupiter plus de 30 minutes (selon la position des planètes).",
          "En observant le ciel, on regarde donc toujours dans le passé : l'image d'un astre est celle qu'il avait quand la lumière en est partie. Pour calculer le temps de trajet, on utilise t = d / c.",
        ],
        formule: "t = d / c",
      },
    ],
    experience:
      "Dans une pièce un peu sombre, tiens une loupe entre une lampe allumée, loin de toi, et une feuille blanche. Éloigne ou rapproche la feuille jusqu'à ce que l'image de la lampe soit nette : la distance loupe-feuille est la distance focale de la loupe. Ne dirige JAMAIS une loupe, une lunette ou des jumelles vers le Soleil.",
    defis: [
      {
        type: "nombre",
        question: "La lunette de Basile a un objectif de distance focale 800 mm et un oculaire de distance focale 20 mm. Quel est son grossissement ?",
        reponse: 40,
        tolerance: 0.01,
        indice: "G = f_objectif / f_oculaire, avec les mêmes unités.",
        solution: ["G = 800 / 20", "G = 40 : les objets paraissent 40 fois plus grands."],
      },
      {
        type: "nombre",
        question:
          "L'objectif a un diamètre de 6 cm, la pupille de l'œil dans le noir environ 6 mm. Combien de fois plus de lumière capte l'objectif ?",
        reponse: 100,
        tolerance: 0.01,
        indice: "La lumière captée est proportionnelle à l'aire, donc au carré du diamètre.",
        solution: [
          "Rapport des diamètres : 60 mm / 6 mm = 10",
          "Rapport des aires : 10² = 100",
          "L'objectif capte 100 fois plus de lumière que l'œil.",
        ],
      },
      {
        type: "nombre",
        question:
          "Quand elle est au plus près, Jupiter est à environ 600 millions de km. Combien de minutes la lumière met-elle pour nous parvenir ? (c = 300 000 km/s ; arrondi à 0,1 min)",
        reponse: 33.3,
        tolerance: 0.02,
        unite: "min",
        indice: "t = d / c en secondes, puis divise par 60.",
        solution: [
          "t = 600 000 000 / 300 000 = 2 000 s",
          "2 000 / 60 ≈ 33,3 minutes",
        ],
      },
      {
        type: "choix",
        question: "Pourquoi la position des points lumineux autour de Jupiter change-t-elle d'une nuit à l'autre ?",
        options: [
          "La lunette tremble",
          "Ce sont des lunes qui tournent autour de Jupiter",
          "Jupiter fait clignoter ses étoiles",
          "Les étoiles proches se déplacent très vite",
        ],
        bonne: 1,
        indice: "Les points restent toujours près de Jupiter et se déplacent avec elle.",
        solution: [
          "Ces points sont des lunes qui orbitent autour de Jupiter.",
          "D'une nuit à l'autre, elles changent de place, passent devant ou derrière la planète.",
        ],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : ne regarde JAMAIS le Soleil avec une lunette, des jumelles, une loupe ou un télescope. La lumière concentrée peut brûler la rétine en une fraction de seconde et rendre aveugle de façon définitive. Observe uniquement la nuit.",
    enVrai:
      "En 1608, le lunettier néerlandais Hans Lippershey dépose une demande de brevet pour une lunette qui rapproche les objets. En 1609-1610, Galilée en construit une, la pointe vers le ciel et découvre le 7 janvier 1610 trois petits astres près de Jupiter, bientôt quatre : Io, Europe, Ganymède et Callisto. Il publie en mars 1610 le « Sidereus Nuncius » (Le Messager céleste). En 1676, à Paris, le Danois Ole Rømer remarque que les éclipses d'Io arrivent en retard quand Jupiter est plus loin de la Terre : il en déduit que la lumière a une vitesse finie.",
    suite:
      "À l'automne, Lina arpente le champ d'orge, l'air préoccupé. Les épis sont maigres et jaunes, la récolte plus faible que l'an dernier alors que le temps était parfait. « La terre est fatiguée, dit-elle. Elle a donné, et personne ne lui a rien rendu. »",
  },

  // 23. Azote et engrais : la terre fatiguée
  {
    id: "azote",
    numero: 23,
    titre: "La terre fatiguée",
    matieres: ["Biologie", "Chimie", "Maths"],
    niveau: 3,
    recit: [
      "Les feuilles de l'orge sont jaune pâle, les tiges courtes. Lina s'accroupit dans le champ, les doigts enfoncés dans la terre. « Il n'y a pas de maladie, pas de manque d'eau. La terre est épuisée. » Anselme grimace : « Depuis trois ans, on sème de l'orge au même endroit. »",
      "Dans le Carnet, une page est soulignée trois fois : les plantes ont besoin d'azote pour fabriquer leurs protéines et leur chlorophylle. L'air en contient 78 %, mais sous forme de N₂, une molécule si solide que les plantes ne peuvent pas l'utiliser. Seules certaines bactéries savent la casser. « Alors d'où vient l'azote du sol ? » demande Mathis. « D'eux, justement. Et de ce que les êtres vivants rendent en mourant. »",
      "Lina se souvient des lentilles qui poussaient près de l'abri. Elle en déterre une touffe : sur les racines, de petites boules blanches, les nodules. Elle en coupe une, et l'intérieur est rose. Des bactéries y vivent et transforment l'azote de l'air en une forme que la plante peut utiliser. « Ces plantes-là nourrissent le sol au lieu de l'épuiser ! »",
      "Le groupe réorganise les champs en trois soles : l'une en céréales, la deuxième en légumineuses (lentilles, pois, fèves), la troisième au repos, où paissent les chèvres qui y laissent leur fumier. Chaque année, on tourne. « Et le compost ? » demande Basile. « Les feuilles, les épluchures, le fumier : en se décomposant, tout rend son azote au sol. Rien ne se perd, tout circule. »",
    ],
    science: [
      {
        titre: "Le cycle de l'azote",
        schema: "cycle-azote",
        texte: [
          "L'azote (N) est un élément indispensable à la vie : il entre dans les protéines et dans l'ADN. Dans l'air, il se trouve sous forme de diazote N₂, très stable, que la plupart des êtres vivants ne peuvent pas utiliser.",
          "Des bactéries, notamment celles qui vivent dans les racines des légumineuses (pois, lentilles, trèfle), le « fixent » : elles le transforment en ammonium, puis d'autres bactéries produisent des nitrates, que les racines absorbent. Les animaux mangent les plantes ; déchets et cadavres sont décomposés et rendent l'azote au sol ; d'autres bactéries en renvoient une partie dans l'air.",
        ],
        formule: "N₂ (air) → NH₄⁺ → NO₃⁻ → protéines",
      },
      {
        titre: "La rotation des cultures",
        texte: [
          "Cultiver toujours la même plante épuise le sol de son azote et d'autres éléments nutritifs. Avec l'assolement triennal, on divise les terres en trois parts (les soles) : une céréale, une légumineuse et une jachère (repos). Chaque année, les cultures tournent.",
          "Une récolte emporte de l'azote hors du champ : il faut le rendre au sol, par les légumineuses, le compost ou le fumier. Les engrais modernes apportent de l'azote en plus, mais en excès ils polluent les nappes et les rivières.",
        ],
      },
    ],
    experience:
      "Fais germer des lentilles ou des haricots dans deux pots : l'un rempli de terre de jardin, l'autre de coton humide uniquement. Arrose les deux avec de l'eau seulement. Après deux semaines, compare : la plante du coton cesse de grandir et jaunit plus vite, faute d'éléments nutritifs. Note tes observations dans un carnet.",
    defis: [
      {
        type: "nombre",
        question: "L'air contient 78 % de diazote. Quel volume de diazote y a-t-il dans 50 m³ d'air, en m³ ?",
        reponse: 39,
        tolerance: 0.01,
        unite: "m³",
        indice: "Calcule 78 % de 50.",
        solution: ["78 % = 0,78", "0,78 × 50 = 39 m³"],
      },
      {
        type: "nombre",
        question:
          "Un champ sans rotation perd 15 % de son azote disponible chaque année. S'il en contient 200 unités au départ, combien en reste-t-il après 2 ans ?",
        reponse: 144.5,
        tolerance: 0.01,
        unite: "unités",
        indice: "Chaque année, il reste 85 % : multiplie par 0,85, deux fois.",
        solution: [
          "Après 1 an : 200 × 0,85 = 170",
          "Après 2 ans : 170 × 0,85 = 144,5 unités",
          "Autre écriture : 200 × 0,85² = 144,5.",
        ],
      },
      {
        type: "nombre",
        question:
          "Un village possède 90 hectares et applique l'assolement triennal (une sole sur trois en jachère). Combien d'hectares sont cultivés chaque année ?",
        reponse: 60,
        tolerance: 0.01,
        unite: "ha",
        indice: "Chaque sole occupe un tiers des terres. Combien de soles sont cultivées ?",
        solution: ["Chaque sole : 90 / 3 = 30 ha", "Deux soles cultivées : 2 × 30 = 60 ha"],
      },
      {
        type: "choix",
        question: "Pourquoi cultiver des lentilles ou des pois enrichit-il la terre en azote ?",
        options: [
          "Leurs feuilles produisent de l'azote par photosynthèse",
          "Des bactéries de leurs racines transforment l'azote de l'air en une forme utilisable",
          "Elles absorbent tout l'azote du sol",
          "Elles font fuir les insectes",
        ],
        bonne: 1,
        indice: "Pense aux petites boules blanches sur les racines.",
        solution: [
          "Dans les nodules des racines vivent des bactéries qui fixent le diazote de l'air.",
          "Cet azote devient utilisable par la plante et, après sa mort, par le sol.",
        ],
      },
    ],
    securite:
      "Ne refais pas ça chez toi : ne fabrique jamais d'engrais chimique et ne mélange pas de produits de jardinage ou d'entretien entre eux : certains mélanges dégagent des gaz toxiques ou peuvent exploser. Contente-toi de compost et de fumier bien décomposé, et lave-toi les mains après avoir touché la terre.",
    enVrai:
      "L'assolement triennal se répand en Europe du Nord à partir du IXe siècle et augmente les récoltes. En 1838, le Français Jean-Baptiste Boussingault montre que des légumineuses semblent puiser de l'azote dans l'air ; en 1886-1888, les Allemands Hermann Hellriegel et Hermann Wilfarth prouvent le rôle des bactéries des nodules, que le Néerlandais Martinus Beijerinck isole en 1888. En 1909, Fritz Haber réussit à fabriquer de l'ammoniac à partir du diazote de l'air et de l'hydrogène ; Carl Bosch l'industrialise à partir de 1913. On estime aujourd'hui que près de la moitié de l'azote de notre alimentation vient de cette synthèse.",
    suite:
      "Cette nuit-là, la voix de Sève, tendue, réveille tout le monde. « Archives... sauvegardées. Treize mille ouvrages, tous les cours, toutes les cartes. Mais le disque se dégrade. Il vous reste quatre mois pour tout copier sur un support qui survive. »",
  },

  // 24. Écriture, imprimerie et binaire : le Grand Livre
  {
    id: "ecriture",
    numero: 24,
    titre: "Le Grand Livre",
    matieres: ["Maths", "Physique"],
    niveau: 3,
    recit: [
      "Sève parle depuis l'écran de l'abri, d'une voix tendue : le dernier disque qui contient les archives de l'ancien monde se dégrade. Médecine, mathématiques, cartes, cours, musiques... « Il me reste peut-être quatre mois. Après, tout sera perdu. »",
      "Quarante personnes de la Combe et de l'Observatoire se réunissent dans le grand hall. Comment sauver tant de savoir, sans électricité fiable ? Mathis propose de tout recopier à la main. Soline calcule : un copiste met deux mois pour un livre. « Il nous faudrait des siècles. »",
      "Basile, lui, tourne autour du pressoir à raisin de la Combe. Il taille des lettres en relief dans de petits blocs de bois dur, les aligne dans un cadre, les enduit d'une encre de suie et d'huile, puis écrase une feuille dessus avec la grande vis. Une page est imprimée, puis dix, puis cent : toujours les mêmes lettres, remises dans un autre ordre pour la page suivante.",
      "Pendant ce temps, Sève, réparée au fil des mois, explique comment elle stocke tout : en 0 et en 1. « Un interrupteur est éteint ou allumé : un bit. Huit bits forment un octet, qui donne 256 combinaisons, assez pour chaque lettre. La lettre A est le nombre 65, soit 01000001. » Mathis, à court de « Prouve-le », se contente de murmurer : « Alors tout est nombres. »",
      "Au bout de l'hiver, la première page sort de la presse, encore humide, parfaitement lisible. Inès ouvre le Carnet à la dernière page et écrit : « Le projet Graine est devenu une forêt. » Elle sourit, puis ajoute en dessous : « Une forêt, ça continue de pousser. »",
    ],
    science: [
      {
        titre: "De l'écriture à l'imprimerie",
        texte: [
          "Écrire permet de conserver et de transmettre le savoir au-delà d'une génération. Mais copier à la main est lent et fait des erreurs. L'imprimerie à caractères mobiles utilise des lettres séparées et réutilisables, qu'on assemble en page, qu'on encre et qu'on presse sur le papier : une fois la page composée, on peut en tirer des centaines d'exemplaires identiques.",
          "Un livre imprimé coûte donc beaucoup moins cher et les erreurs de copie disparaissent presque. C'est ainsi que la science a pu circuler et être vérifiée par d'autres.",
        ],
      },
      {
        titre: "Le binaire : tout avec des 0 et des 1",
        schema: "binaire",
        texte: [
          "Dans le système binaire, on n'utilise que deux chiffres, 0 et 1. En partant de la droite, chaque case vaut deux fois la précédente : 1, 2, 4, 8, 16, 32, 64, 128... Pour lire un nombre binaire, on additionne les valeurs des cases où il y a un 1 : 101101 = 32 + 8 + 4 + 1 = 45.",
          "Un bit est un 0 ou un 1. Avec n bits, on peut écrire 2ⁿ nombres différents. Un octet (8 bits) en donne 256, assez pour coder chaque lettre, chiffre ou signe : la lettre A est 65, soit 01000001. Textes, images et musiques peuvent ainsi être stockés en suites de bits.",
        ],
        formule: "n bits → 2ⁿ combinaisons",
      },
    ],
    experience:
      "Écris ton prénom en binaire avec un code simple : A = 1, B = 2, C = 3... Z = 26. Écris ensuite chaque nombre en binaire (par exemple C = 3 = 11 et L = 12 = 1100). Échange le message codé avec un ami, qui devra le décoder avec la même table.",
    defis: [
      {
        type: "nombre",
        question: "Convertis le nombre binaire 101101 en nombre décimal.",
        reponse: 45,
        tolerance: 0.01,
        indice: "Les cases valent 32, 16, 8, 4, 2, 1 en partant de la gauche. Additionne celles qui contiennent un 1.",
        solution: ["101101 : cases 32, 8, 4 et 1 à 1", "32 + 8 + 4 + 1 = 45"],
      },
      {
        type: "choix",
        question: "Quelle est l'écriture binaire du nombre 25 ?",
        options: ["10011", "11001", "11100", "10101"],
        bonne: 1,
        indice: "Décompose 25 en 16, 8, 4, 2 et 1.",
        solution: [
          "25 = 16 + 8 + 1",
          "Cases 16, 8 et 1 à 1 ; cases 4 et 2 à 0 : 11001.",
          "Vérification : 10011 = 19, 11100 = 28, 10101 = 21.",
        ],
      },
      {
        type: "nombre",
        question: "Combien de symboles différents peut-on coder avec un octet (8 bits) ?",
        reponse: 256,
        tolerance: 0.01,
        indice: "Avec n bits, on a 2ⁿ combinaisons.",
        solution: ["2⁸ = 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 = 256"],
      },
      {
        type: "nombre",
        question:
          "Une page contient 2 000 caractères, codés chacun sur 1 octet. Combien de kilooctets (1 ko = 1 000 octets) faut-il pour un livre de 300 pages ?",
        reponse: 600,
        tolerance: 0.01,
        unite: "ko",
        indice: "Calcule d'abord le nombre d'octets du livre, puis convertis.",
        solution: ["300 × 2 000 = 600 000 octets", "600 000 / 1 000 = 600 ko"],
      },
    ],
    enVrai:
      "Les plus anciennes écritures connues apparaissent à Sumer (Mésopotamie) vers 3300 av. J.-C., avec des signes imprimés dans l'argile. Vers 1450, à Mayence, Johannes Gutenberg met au point l'imprimerie à caractères mobiles ; sa Bible à 42 lignes sort vers 1455. En 1703, le philosophe et mathématicien Leibniz publie son arithmétique binaire. En 1948, Claude Shannon fonde la théorie de l'information et le mot « bit » se répand. Le code ASCII, qui donne 65 à la lettre A, est normalisé en 1963.",
    suite:
      "Fin du premier tome du Carnet. Mais en refermant le livre, Inès entend la voix de Sève : « Signal détecté. Nouvelle fréquence. Source : très loin, vers l'est. » Elle sourit. Une forêt, ça continue de pousser.",
  },
]
