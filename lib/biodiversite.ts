// Biodiversité par continent : grands milieux (biomes), plantes et animaux
// typiques, menaces et quiz. Les chiffres par pays (espèces observées, forêts)
// viennent de public/atlas/nature.json (GBIF et Banque mondiale).

export type Espece = { nom: string; sci: string; desc: string } // sci = nom scientifique latin exact
export type Biome = { nom: string; desc: string; ou: string; plantes: Espece[]; animaux: Espece[] }
export type QuestionNature = { question: string; options: string[]; bonne: number; explication: string }
export type Continent = {
  id: string
  nom: string
  emoji: string
  centre: [number, number] // [longitude, latitude] pour centrer le globe
  resume: string[] // 2-3 paragraphes
  chiffres: { nom: string; valeur: string; source: string }[]
  biomes: Biome[]
  emblemes: Espece[]
  menaces: string[]
  pays: string[] // codes ISO 3166-1 alpha-3
  quiz: QuestionNature[]
}

// Notions clés pour comprendre la biodiversité
export const NOTIONS: { titre: string; texte: string }[] = [
  {
    titre: "Biodiversité",
    texte:
      "La biodiversité, c'est la variété du vivant à trois niveaux : la diversité des espèces (animaux, plantes, champignons, microbes), la diversité des gènes à l'intérieur d'une espèce, et la diversité des écosystèmes (forêts, récifs, déserts...). Plus elle est riche, plus la nature est capable de s'adapter aux changements.",
  },
  {
    titre: "Espèce endémique",
    texte:
      "Une espèce endémique vit naturellement dans une seule région du monde et nulle part ailleurs. Les lémuriens sont endémiques de Madagascar. Les îles isolées comptent beaucoup d'espèces endémiques, mais elles sont aussi très fragiles : si leur habitat disparaît, l'espèce disparaît pour toujours.",
  },
  {
    titre: "Biome",
    texte:
      "Un biome est un grand type de milieu défini par son climat et sa végétation : forêt tropicale, savane, désert, toundra, taïga, prairie... Des régions très éloignées peuvent avoir le même biome, avec des espèces différentes mais des adaptations semblables.",
  },
  {
    titre: "Liste rouge de l'UICN",
    texte:
      "L'Union internationale pour la conservation de la nature (UICN) classe les espèces selon leur risque de disparition. Vulnérable (VU) : risque élevé de disparaître à l'état sauvage. En danger (EN) : risque très élevé. En danger critique (CR) : risque extrêmement élevé. Viennent ensuite les catégories « éteint à l'état sauvage » et « éteint » (EX), tandis que « quasi menacé » (NT) et « préoccupation mineure » (LC) désignent les espèces non menacées pour l'instant.",
  },
  {
    titre: "Point chaud de biodiversité",
    texte:
      "Un point chaud (hotspot) est une région qui abrite au moins 1 500 espèces de plantes endémiques et qui a déjà perdu plus de 70 % de sa végétation d'origine. On en compte 36 dans le monde. Ils couvrent une petite part des terres émergées mais contiennent une très grande part des espèces menacées : ce sont des priorités pour la protection.",
  },
  {
    titre: "Services écosystémiques",
    texte:
      "Ce sont les bienfaits que la nature nous apporte gratuitement : nourriture, eau propre et bois (approvisionnement), pollinisation des cultures, filtration de l'eau, stockage du carbone et protection contre les crues (régulation), paysages et loisirs (culturels), formation des sols (soutien). Quand la biodiversité recule, ces services s'affaiblissent.",
  },
]

export const CONTINENTS: Continent[] = [
  // ---------------------------------------------------------------- AFRIQUE
  {
    id: "afrique",
    nom: "Afrique",
    emoji: "🌍",
    centre: [20, 2],
    resume: [
      "L'Afrique s'étend de part et d'autre de l'équateur. On y trouve le plus grand désert chaud du monde (le Sahara), de vastes savanes, la deuxième plus grande forêt tropicale du monde (le bassin du Congo) et des montagnes qui portent des glaciers près de l'équateur.",
      "Les savanes d'Afrique de l'Est et d'Afrique australe abritent les plus grands animaux terrestres : éléphants, girafes, rhinocéros et grands félins. Madagascar, île isolée depuis des dizaines de millions d'années, a développé une faune et une flore uniques au monde.",
      "Cette richesse est sous pression : le braconnage, la perte des habitats et le changement climatique menacent de nombreuses espèces. Beaucoup de parcs nationaux et de programmes locaux de protection montrent pourtant que la conservation peut fonctionner.",
    ],
    chiffres: [
      { nom: "Surface de forêts", valeur: "environ 636 millions d'hectares", source: "FAO, Évaluation des ressources forestières mondiales 2020" },
      { nom: "Plantes de la région florale du Cap", valeur: "environ 9 000 espèces, dont 69 % endémiques", source: "UNESCO" },
      { nom: "Lémuriens de Madagascar", valeur: "plus de 100 espèces, toutes endémiques", source: "UICN" },
      { nom: "Éléphant de forêt d'Afrique", valeur: "en danger critique (CR) depuis 2021", source: "UICN, Liste rouge" },
    ],
    biomes: [
      {
        nom: "Savane",
        desc: "Grandes herbes, arbres dispersés, saison sèche marquée. Les grands troupeaux d'herbivores y suivent les pluies, et les prédateurs suivent les troupeaux.",
        ou: "Afrique de l'Est (Serengeti, Kenya), Afrique australe, bande au sud du Sahel",
        plantes: [
          { nom: "Acacia parasol", sci: "Vachellia tortilis", desc: "Arbre à cime aplatie, armé d'épines, dont les gousses nourrissent de nombreux herbivores." },
          { nom: "Baobab africain", sci: "Adansonia digitata", desc: "Arbre géant qui stocke l'eau dans son tronc épais pour survivre à la saison sèche." },
          { nom: "Herbe à kangourou", sci: "Themeda triandra", desc: "Graminée dominante des savanes, très résistante au feu et au broutage." },
        ],
        animaux: [
          { nom: "Éléphant de savane", sci: "Loxodonta africana", desc: "Plus grand animal terrestre ; il façonne le paysage en abattant des arbres et en creusant des points d'eau." },
          { nom: "Lion", sci: "Panthera leo", desc: "Seul félin vivant en groupe social, la troupe, qui chasse en coopération." },
          { nom: "Girafe", sci: "Giraffa camelopardalis", desc: "Plus haut animal terrestre, elle broute le feuillage des acacias." },
          { nom: "Gnou bleu", sci: "Connochaetes taurinus", desc: "Antilope qui réalise de grandes migrations avec les zèbres, à la recherche de pâturages." },
        ],
      },
      {
        nom: "Forêt tropicale du bassin du Congo",
        desc: "Forêt dense, chaude et très humide toute l'année, avec plusieurs étages de végétation. Elle stocke beaucoup de carbone et abrite de nombreux primates.",
        ou: "République démocratique du Congo, Congo, Gabon, Cameroun, Guinée équatoriale",
        plantes: [
          { nom: "Okoumé", sci: "Aucoumea klaineana", desc: "Grand arbre du Gabon au bois léger, très exploité." },
          { nom: "Sapelli", sci: "Entandrophragma cylindricum", desc: "Arbre géant de la canopée, au bois rougeâtre apprécié en menuiserie." },
          { nom: "Iroko", sci: "Milicia excelsa", desc: "Grand arbre à croissance lente, au bois très résistant." },
          { nom: "Gilbertiodendron", sci: "Gilbertiodendron dewevrei", desc: "Arbre qui forme de grandes forêts presque pures dans le bassin du Congo." },
        ],
        animaux: [
          { nom: "Gorille de l'Ouest", sci: "Gorilla gorilla", desc: "Grand singe herbivore, qui vit en groupe mené par un mâle dominant." },
          { nom: "Bonobo", sci: "Pan paniscus", desc: "Proche cousin du chimpanzé, vivant uniquement au sud du fleuve Congo." },
          { nom: "Okapi", sci: "Okapia johnstoni", desc: "Cousin de la girafe aux pattes rayées, très discret, endémique de la RDC." },
          { nom: "Éléphant de forêt", sci: "Loxodonta cyclotis", desc: "Plus petit que celui de savane, il disperse les graines de nombreux arbres." },
        ],
      },
      {
        nom: "Désert du Sahara et zones arides",
        desc: "Très peu de pluie et de fortes différences de température entre le jour et la nuit. Les êtres vivants y économisent l'eau et sortent surtout la nuit.",
        ou: "Sahara (Afrique du Nord), Sahel au sud ; déserts du Namib et du Kalahari en Afrique australe",
        plantes: [
          { nom: "Palmier dattier", sci: "Phoenix dactylifera", desc: "Pousse dans les oasis, où ses racines trouvent l'eau souterraine." },
          { nom: "Pomme de Sodome", sci: "Calotropis procera", desc: "Arbuste aux grandes feuilles épaisses, résistant à la sécheresse." },
          { nom: "Panic turgide", sci: "Panicum turgidum", desc: "Graminée en touffes qui fixe le sable et nourrit les animaux du désert." },
        ],
        animaux: [
          { nom: "Fennec", sci: "Vulpes zerda", desc: "Petit renard aux grandes oreilles qui évacuent la chaleur et captent les sons." },
          { nom: "Addax", sci: "Addax nasomaculatus", desc: "Antilope des sables, capable de vivre sans boire grâce à l'eau de sa nourriture." },
          { nom: "Gerboise égyptienne", sci: "Jaculus jaculus", desc: "Petit rongeur sauteur, actif la nuit, qui vit dans un terrier frais." },
          { nom: "Vipère à cornes", sci: "Cerastes cerastes", desc: "Serpent qui s'enfouit dans le sable pour chasser à l'affût." },
        ],
      },
      {
        nom: "Forêts de Madagascar",
        desc: "Forêts humides à l'est, forêts sèches à l'ouest. Madagascar s'est séparée de l'Afrique il y a plus de 100 millions d'années, ce qui explique le très grand nombre d'espèces endémiques.",
        ou: "Madagascar (océan Indien)",
        plantes: [
          { nom: "Baobab de Grandidier", sci: "Adansonia grandidieri", desc: "Baobab géant à tronc très droit, endémique de Madagascar." },
          { nom: "Arbre du voyageur", sci: "Ravenala madagascariensis", desc: "Grand arbre à feuilles en éventail, emblème de l'île." },
          { nom: "Pachypode de Lamer", sci: "Pachypodium lamerei", desc: "Plante au tronc épineux qui stocke l'eau." },
          { nom: "Didierea", sci: "Didierea madagascariensis", desc: "Plante épineuse typique de la forêt sèche du sud-ouest." },
        ],
        animaux: [
          { nom: "Maki catta", sci: "Lemur catta", desc: "Lémurien à longue queue annelée, très sociable." },
          { nom: "Indri", sci: "Indri indri", desc: "Plus grand lémurien vivant, connu pour son chant puissant." },
          { nom: "Aye-aye", sci: "Daubentonia madagascariensis", desc: "Lémurien nocturne qui tapote les troncs pour trouver des larves." },
          { nom: "Caméléon de Parson", sci: "Calumma parsonii", desc: "Un des plus grands caméléons du monde, vivant en forêt humide." },
        ],
      },
    ],
    emblemes: [
      { nom: "Éléphant de savane", sci: "Loxodonta africana", desc: "Classé en danger (EN) par l'UICN depuis 2021." },
      { nom: "Lion", sci: "Panthera leo", desc: "Le « roi des animaux » a disparu d'une grande partie de son ancienne aire de répartition." },
      { nom: "Gorille de montagne", sci: "Gorilla beringei", desc: "Vit dans les forêts de montagne d'Afrique centrale, il est protégé dans plusieurs parcs." },
      { nom: "Okapi", sci: "Okapia johnstoni", desc: "Animal discret, endémique de la RDC, découvert par la science en 1901." },
      { nom: "Maki catta", sci: "Lemur catta", desc: "Symbole de Madagascar, aujourd'hui menacé." },
      { nom: "Baobab africain", sci: "Adansonia digitata", desc: "Surnommé « arbre de vie », il peut vivre des siècles." },
    ],
    menaces: [
      "Le braconnage : l'ivoire des éléphants et la corne des rhinocéros alimentent un trafic illégal qui a fait chuter leurs populations.",
      "La déforestation : l'agriculture sur brûlis, l'exploitation du bois et le charbon de bois détruisent les forêts, en particulier à Madagascar et en Afrique de l'Ouest.",
      "Le changement climatique et la désertification : sécheresses plus longues et plus fréquentes, qui font reculer les pâturages et les points d'eau.",
      "La chasse pour la viande de brousse et le recul des habitats dû à l'augmentation de la population et des cultures.",
    ],
    pays: [
      "DZA", "AGO", "BEN", "BWA", "BFA", "BDI", "CMR", "CPV", "CAF", "TCD", "COM", "COG", "COD", "CIV", "DJI",
      "EGY", "GNQ", "ERI", "SWZ", "ETH", "GAB", "GMB", "GHA", "GIN", "GNB", "KEN", "LSO", "LBR", "LBY", "MDG",
      "MWI", "MLI", "MRT", "MUS", "MAR", "MOZ", "NAM", "NER", "NGA", "RWA", "STP", "SEN", "SYC", "SLE", "SOM",
      "ZAF", "SSD", "SDN", "TZA", "TGO", "TUN", "UGA", "ZMB", "ZWE", "ESH", "REU", "MYT", "SHN",
    ],
    quiz: [
      {
        question: "Quel groupe d'animaux est endémique de Madagascar ?",
        options: ["Les okapis", "Les lémuriens", "Les gorilles", "Les guépards"],
        bonne: 1,
        explication: "Les lémuriens ne vivent à l'état sauvage qu'à Madagascar, île isolée du continent depuis très longtemps.",
      },
      {
        question: "Dans quel désert vit le fennec ?",
        options: ["Le Sahara", "Le désert de Gobi", "Le désert d'Atacama", "Le désert d'Arabie"],
        bonne: 0,
        explication: "Le fennec vit au Sahara et dans les zones arides voisines d'Afrique du Nord. Ses grandes oreilles l'aident à se rafraîchir.",
      },
      {
        question: "En 2021, comment l'UICN a-t-elle classé l'éléphant de forêt d'Afrique ?",
        options: ["Vulnérable", "En danger", "En danger critique", "Préoccupation mineure"],
        bonne: 2,
        explication: "L'éléphant de forêt est passé en danger critique (CR) en 2021, et l'éléphant de savane en danger (EN).",
      },
      {
        question: "Quel bassin abrite la plus grande forêt tropicale d'Afrique ?",
        options: ["Le bassin du Nil", "Le bassin du Zambèze", "Le bassin du Niger", "Le bassin du Congo"],
        bonne: 3,
        explication: "La forêt du bassin du Congo est la deuxième plus grande forêt tropicale du monde, après l'Amazonie.",
      },
    ],
  },

  // ------------------------------------------------------- AMÉRIQUE DU NORD
  {
    id: "amerique-nord",
    nom: "Amérique du Nord",
    emoji: "🌎",
    centre: [-100, 45],
    resume: [
      "L'Amérique du Nord regroupe le Canada, les États-Unis, le Mexique, l'Amérique centrale, les Caraïbes et le Groenland. Elle s'étend de l'Arctique aux forêts tropicales, ce qui lui donne une grande variété de milieux : toundra, forêt boréale, prairies, déserts et forêts humides.",
      "Le nord est dominé par la forêt boréale, immense bande de conifères. Au centre, les Grandes Plaines étaient autrefois peuplées de dizaines de millions de bisons. Plus au sud, le Mexique et l'Amérique centrale forment un pont entre deux continents, avec une biodiversité exceptionnelle.",
      "Les Caraïbes et l'Amérique centrale font partie des points chauds de biodiversité de la planète. Les pressions y sont fortes : urbanisation, agriculture, feux plus fréquents et espèces introduites.",
    ],
    chiffres: [
      { nom: "Surface de forêts (Amérique du Nord et centrale)", valeur: "environ 751 millions d'hectares", source: "FAO, Évaluation des ressources forestières mondiales 2020" },
      { nom: "Grands Lacs", valeur: "près de 20 % de l'eau douce de surface du monde", source: "Agence américaine de protection de l'environnement (EPA)" },
      { nom: "Mexique", valeur: "classé parmi les pays mégadivers", source: "PNUE-WCMC" },
      { nom: "Papillon monarque migrateur", valeur: "vulnérable (VU) depuis 2023", source: "UICN, Liste rouge" },
    ],
    biomes: [
      {
        nom: "Forêt boréale (taïga)",
        desc: "Immense forêt de conifères aux hivers longs et très froids. Les sols sont pauvres et souvent gelés, et les tourbières y stockent beaucoup de carbone.",
        ou: "Canada, Alaska, nord des États-Unis",
        plantes: [
          { nom: "Épinette noire", sci: "Picea mariana", desc: "Conifère très répandu, qui supporte les sols froids et mal drainés." },
          { nom: "Sapin baumier", sci: "Abies balsamea", desc: "Conifère au feuillage parfumé, apprécié comme sapin de Noël." },
          { nom: "Pin gris", sci: "Pinus banksiana", desc: "Pin dont les cônes s'ouvrent grâce à la chaleur d'un incendie." },
          { nom: "Bouleau à papier", sci: "Betula papyrifera", desc: "Feuillu pionnier à l'écorce blanche qui se détache en lamelles." },
        ],
        animaux: [
          { nom: "Orignal", sci: "Alces alces", desc: "Plus grand cervidé du monde, qui se nourrit de plantes aquatiques et de rameaux." },
          { nom: "Loup gris", sci: "Canis lupus", desc: "Chasseur en meute, il régule les populations de cervidés." },
          { nom: "Lynx du Canada", sci: "Lynx canadensis", desc: "Félin aux grandes pattes poilues, spécialiste du lièvre d'Amérique." },
          { nom: "Caribou", sci: "Rangifer tarandus", desc: "Cervidé qui réalise de longues migrations entre forêt et toundra." },
        ],
      },
      {
        nom: "Forêt tempérée de feuillus",
        desc: "Forêt dont les arbres perdent leurs feuilles en automne. Les quatre saisons sont bien marquées, et les couleurs d'automne y sont célèbres.",
        ou: "Est des États-Unis et du Canada (Appalaches, Grands Lacs, Nouvelle-Angleterre)",
        plantes: [
          { nom: "Érable à sucre", sci: "Acer saccharum", desc: "Sa sève sert à produire le sirop d'érable." },
          { nom: "Chêne rouge", sci: "Quercus rubra", desc: "Grand chêne dont les glands nourrissent écureuils et cerfs." },
          { nom: "Tulipier de Virginie", sci: "Liriodendron tulipifera", desc: "Arbre élevé aux fleurs en forme de tulipe." },
          { nom: "Hêtre à grandes feuilles", sci: "Fagus grandifolia", desc: "Arbre à l'écorce grise et lisse, dont les faînes nourrissent la faune." },
        ],
        animaux: [
          { nom: "Cerf de Virginie", sci: "Odocoileus virginianus", desc: "Cervidé le plus répandu du continent, au pelage roux l'été." },
          { nom: "Ours noir", sci: "Ursus americanus", desc: "Omnivore qui passe l'hiver en hibernation partielle." },
          { nom: "Dindon sauvage", sci: "Meleagris gallopavo", desc: "Grand oiseau forestier à l'origine du dindon domestique." },
          { nom: "Raton laveur", sci: "Procyon lotor", desc: "Petit mammifère adroit, au masque noir sur le visage." },
        ],
      },
      {
        nom: "Prairies des Grandes Plaines",
        desc: "Vastes étendues d'herbes sans arbres, façonnées par le vent, le feu et le broutage. Leurs sols très riches ont presque tous été transformés en champs.",
        ou: "Centre des États-Unis et sud du Canada (Prairies canadiennes)",
        plantes: [
          { nom: "Boutelou gracieux", sci: "Bouteloua gracilis", desc: "Herbe courte résistante à la sécheresse, base des prairies sèches." },
          { nom: "Grand barbon", sci: "Andropogon gerardii", desc: "Herbe haute des prairies humides, qui peut dépasser 2 m." },
          { nom: "Panic raide", sci: "Panicum virgatum", desc: "Herbe vivace aux racines profondes, qui retient le sol." },
          { nom: "Échinacée pourpre", sci: "Echinacea purpurea", desc: "Fleur à cœur épineux, très visitée par les pollinisateurs." },
        ],
        animaux: [
          { nom: "Bison d'Amérique", sci: "Bison bison", desc: "Plus grand mammifère terrestre d'Amérique du Nord, presque exterminé au XIXe siècle puis protégé." },
          { nom: "Chien de prairie à queue noire", sci: "Cynomys ludovicianus", desc: "Rongeur social qui creuse des villages souterrains." },
          { nom: "Antilocapre", sci: "Antilocapra americana", desc: "Un des animaux terrestres les plus rapides d'Amérique du Nord." },
          { nom: "Putois à pieds noirs", sci: "Mustela nigripes", desc: "Petit carnivore rare qui se nourrit de chiens de prairie." },
        ],
      },
      {
        nom: "Forêts tropicales d'Amérique centrale",
        desc: "Forêts chaudes et humides situées entre le Mexique et le Panama. Cet étroit pont de terre a permis des échanges d'espèces entre le nord et le sud du continent.",
        ou: "Sud du Mexique, Guatemala, Belize, Costa Rica, Panama",
        plantes: [
          { nom: "Acajou à grandes feuilles", sci: "Swietenia macrophylla", desc: "Grand arbre au bois précieux, très exploité." },
          { nom: "Kapokier", sci: "Ceiba pentandra", desc: "Arbre géant de la canopée, sacré pour les Mayas." },
          { nom: "Cacaoyer", sci: "Theobroma cacao", desc: "Petit arbre de sous-bois dont les graines donnent le chocolat." },
          { nom: "Trompette", sci: "Cecropia peltata", desc: "Arbre à croissance rapide qui colonise les clairières." },
        ],
        animaux: [
          { nom: "Quetzal resplendissant", sci: "Pharomachrus mocinno", desc: "Oiseau aux plumes vertes brillantes, vivant dans les forêts de nuages." },
          { nom: "Jaguar", sci: "Panthera onca", desc: "Plus grand félin d'Amérique, excellent nageur." },
          { nom: "Singe hurleur à manteau", sci: "Alouatta palliata", desc: "Son cri puissant s'entend à plusieurs kilomètres." },
          { nom: "Rainette aux yeux rouges", sci: "Agalychnis callidryas", desc: "Grenouille arboricole verte aux yeux rouges, active la nuit." },
        ],
      },
    ],
    emblemes: [
      { nom: "Pygargue à tête blanche", sci: "Haliaeetus leucocephalus", desc: "Rapace pêcheur, emblème des États-Unis." },
      { nom: "Bison d'Amérique", sci: "Bison bison", desc: "Symbole des Grandes Plaines, dont les populations se sont reconstituées grâce à la protection." },
      { nom: "Ours brun (grizzli)", sci: "Ursus arctos", desc: "Vit dans l'ouest du Canada et en Alaska ; en Amérique du Nord, on l'appelle souvent grizzli." },
      { nom: "Papillon monarque", sci: "Danaus plexippus", desc: "Migre sur des milliers de kilomètres du Canada jusqu'au Mexique." },
      { nom: "Séquoia géant", sci: "Sequoiadendron giganteum", desc: "Un des arbres les plus massifs du monde, dans la Sierra Nevada en Californie." },
      { nom: "Quetzal resplendissant", sci: "Pharomachrus mocinno", desc: "Oiseau sacré des civilisations mésoaméricaines." },
    ],
    menaces: [
      "La perte et la fragmentation des habitats : villes, routes et cultures remplacent forêts et prairies, notamment dans les Grandes Plaines et en Amérique centrale.",
      "Le changement climatique : feux de forêt plus intenses, fonte de la banquise arctique et du pergélisol, blanchissement des coraux caribéens.",
      "Les espèces envahissantes : par exemple l'agrile du frêne (Agrilus planipennis), un insecte venu d'Asie qui tue des millions de frênes.",
      "La déforestation tropicale en Amérique centrale, liée à l'élevage, aux cultures et à l'exploitation du bois.",
    ],
    pays: [
      "USA", "CAN", "MEX", "GRL", "BMU", "SPM", "GTM", "BLZ", "SLV", "HND", "NIC", "CRI", "PAN", "CUB", "JAM",
      "HTI", "DOM", "BHS", "BRB", "TTO", "GRD", "LCA", "VCT", "ATG", "KNA", "DMA", "PRI", "VIR", "VGB", "AIA",
      "MSR", "CYM", "TCA", "ABW", "CUW", "SXM", "GLP", "MTQ", "BLM", "MAF", "BES",
    ],
    quiz: [
      {
        question: "Quel papillon migre chaque année du Canada vers le Mexique ?",
        options: ["Le morpho bleu", "Le monarque", "Le machaon", "Le paon-du-jour"],
        bonne: 1,
        explication: "Le papillon monarque parcourt des milliers de kilomètres. La génération qui migre vers le sud vit plus longtemps que les autres.",
      },
      {
        question: "Quels arbres dominent la forêt boréale d'Amérique du Nord ?",
        options: ["Des conifères (épinettes, sapins, pins)", "Des chênes", "Des palmiers", "Des eucalyptus"],
        bonne: 0,
        explication: "La forêt boréale est surtout composée de conifères adaptés aux hivers longs et froids.",
      },
      {
        question: "Dans quel milieu vit surtout le bison d'Amérique ?",
        options: ["La toundra", "La forêt tropicale", "Les prairies des Grandes Plaines", "Les récifs coralliens"],
        bonne: 2,
        explication: "Le bison est un herbivore des grandes prairies, où il broute les herbes.",
      },
      {
        question: "Dans quelle région vit le quetzal resplendissant ?",
        options: ["L'Alaska", "La Floride", "Le Groenland", "L'Amérique centrale"],
        bonne: 3,
        explication: "Cet oiseau vit dans les forêts de nuages du sud du Mexique et d'Amérique centrale.",
      },
    ],
  },

  // ------------------------------------------------------- AMÉRIQUE DU SUD
  {
    id: "amerique-sud",
    nom: "Amérique du Sud",
    emoji: "🌎",
    centre: [-60, -15],
    resume: [
      "L'Amérique du Sud est le continent le plus riche en espèces de la planète. Elle compte la plus grande forêt tropicale du monde, l'Amazonie, la plus longue chaîne de montagnes continentale, les Andes, ainsi que des savanes, des zones humides et des steppes froides en Patagonie.",
      "L'Amazonie abrite à elle seule environ une espèce connue sur dix de la planète. Les Andes tropicales sont un point chaud de biodiversité, avec de nombreuses espèces qui ne vivent qu'à une altitude précise. Les îles Galápagos, au large de l'Équateur, ont inspiré à Charles Darwin sa théorie de l'évolution.",
      "Ces milieux sont très menacés par la déforestation, l'élevage, l'orpaillage et les incendies. La forêt amazonienne régule le climat et l'eau de toute la région : sa protection est un enjeu mondial.",
    ],
    chiffres: [
      { nom: "Surface de forêts", valeur: "environ 844 millions d'hectares", source: "FAO, Évaluation des ressources forestières mondiales 2020" },
      { nom: "Biome amazonien", valeur: "environ 6,7 millions de km²", source: "WWF" },
      { nom: "Andes tropicales", valeur: "environ 30 000 espèces de plantes, dont la moitié endémiques", source: "CEPF (Fonds de partenariat pour les écosystèmes critiques)" },
      { nom: "Espèces connues vivant en Amazonie", valeur: "environ une espèce connue sur dix de la planète vit en Amazonie", source: "WWF" },
    ],
    biomes: [
      {
        nom: "Forêt amazonienne",
        desc: "Forêt chaude et humide toute l'année, organisée en étages. Elle produit une grande part de ses propres pluies et abrite une diversité immense d'insectes, de plantes et de poissons.",
        ou: "Brésil, Pérou, Colombie, Équateur, Bolivie, Venezuela, Guyane",
        plantes: [
          { nom: "Hévéa", sci: "Hevea brasiliensis", desc: "Arbre dont le latex sert à fabriquer le caoutchouc." },
          { nom: "Noyer du Brésil", sci: "Bertholletia excelsa", desc: "Géant de la forêt, dont les graines sont les noix du Brésil." },
          { nom: "Victoria d'Amazonie", sci: "Victoria amazonica", desc: "Nénuphar géant dont les feuilles peuvent dépasser 2 m de diamètre." },
          { nom: "Cacaoyer", sci: "Theobroma cacao", desc: "Arbre de sous-bois originaire des forêts tropicales d'Amérique." },
        ],
        animaux: [
          { nom: "Jaguar", sci: "Panthera onca", desc: "Plus grand félin d'Amérique, à la morsure puissante." },
          { nom: "Ara rouge", sci: "Ara macao", desc: "Grand perroquet coloré qui vit en couple, souvent en bandes." },
          { nom: "Paresseux à trois doigts", sci: "Bradypus variegatus", desc: "Se déplace très lentement, sa fourrure abrite des algues." },
          { nom: "Dauphin rose d'Amazonie", sci: "Inia geoffrensis", desc: "Dauphin d'eau douce qui nage dans les forêts inondées." },
        ],
      },
      {
        nom: "Andes : páramo, puna et forêts de montagne",
        desc: "Les milieux changent avec l'altitude : forêts de nuages, páramo humide, puna sèche, puis neiges. Le froid et l'air raréfié favorisent des espèces très spécialisées.",
        ou: "Cordillère des Andes, de la Colombie au Chili et à l'Argentine",
        plantes: [
          { nom: "Frailejón", sci: "Espeletia grandiflora", desc: "Plante du páramo à rosette de feuilles duveteuses, qui capte l'eau des brumes." },
          { nom: "Polylepis", sci: "Polylepis incana", desc: "Arbre d'altitude à l'écorce en lamelles, qui pousse jusqu'à plus de 4 000 m." },
          { nom: "Pomme de terre", sci: "Solanum tuberosum", desc: "Cultivée depuis des millénaires dans les Andes, qui comptent des milliers de variétés." },
          { nom: "Quinoa", sci: "Chenopodium quinoa", desc: "Plante cultivée pour ses graines, tolérante au froid et à l'altitude." },
        ],
        animaux: [
          { nom: "Condor des Andes", sci: "Vultur gryphus", desc: "Un des plus grands oiseaux volants du monde, qui plane grâce aux courants d'air." },
          { nom: "Vigogne", sci: "Vicugna vicugna", desc: "Petit camélidé sauvage à la laine très fine." },
          { nom: "Ours à lunettes", sci: "Tremarctos ornatus", desc: "Seul ours d'Amérique du Sud, reconnaissable aux marques claires autour des yeux." },
          { nom: "Lama", sci: "Lama glama", desc: "Camélidé domestiqué, utilisé comme animal de bât et pour sa laine." },
        ],
      },
      {
        nom: "Cerrado (savane brésilienne)",
        desc: "Savane arborée du centre du Brésil, très riche en plantes endémiques. Ses arbres tortueux ont de longues racines et une écorce épaisse qui résiste au feu.",
        ou: "Centre du Brésil, avec des zones en Bolivie et au Paraguay",
        plantes: [
          { nom: "Pequi", sci: "Caryocar brasiliense", desc: "Arbre dont le fruit est très utilisé dans la cuisine du Cerrado." },
          { nom: "Ipé jaune", sci: "Handroanthus ochraceus", desc: "Arbre qui fleurit en jaune vif en saison sèche." },
          { nom: "Buriti", sci: "Mauritia flexuosa", desc: "Palmier des zones humides, dont les fruits nourrissent de nombreux animaux." },
        ],
        animaux: [
          { nom: "Loup à crinière", sci: "Chrysocyon brachyurus", desc: "Grand canidé aux longues pattes, qui mange aussi des fruits." },
          { nom: "Grand fourmilier", sci: "Myrmecophaga tridactyla", desc: "Se nourrit de fourmis et de termites grâce à sa langue très longue." },
          { nom: "Tatou géant", sci: "Priodontes maximus", desc: "Plus grand tatou du monde, qui creuse de profonds terriers." },
          { nom: "Nandou d'Amérique", sci: "Rhea americana", desc: "Grand oiseau coureur qui ne vole pas." },
        ],
      },
      {
        nom: "Forêts et steppes de Patagonie",
        desc: "Au sud du continent, le climat est froid et venteux. Des forêts de hêtres austraux couvrent les pentes des Andes, et des steppes sèches s'étendent à l'est.",
        ou: "Sud du Chili et de l'Argentine",
        plantes: [
          { nom: "Araucaria du Chili", sci: "Araucaria araucana", desc: "Conifère ancien aux branches en parasol, appelé aussi désespoir des singes." },
          { nom: "Hêtre antarctique", sci: "Nothofagus antarctica", desc: "Petit arbre qui résiste au vent et au froid." },
          { nom: "Alerce", sci: "Fitzroya cupressoides", desc: "Conifère géant qui peut vivre plus de 3 000 ans." },
        ],
        animaux: [
          { nom: "Guanaco", sci: "Lama guanicoe", desc: "Camélidé sauvage des steppes, ancêtre du lama." },
          { nom: "Puma", sci: "Puma concolor", desc: "Félin qui vit du Canada à la Patagonie, grand chasseur de guanacos." },
          { nom: "Pudu du Sud", sci: "Pudu puda", desc: "Un des plus petits cerfs du monde, discret dans les forêts humides." },
          { nom: "Manchot de Magellan", sci: "Spheniscus magellanicus", desc: "Niche dans des terriers sur les côtes de Patagonie." },
        ],
      },
    ],
    emblemes: [
      { nom: "Jaguar", sci: "Panthera onca", desc: "Plus grand félin d'Amérique, symbole de l'Amazonie." },
      { nom: "Condor des Andes", sci: "Vultur gryphus", desc: "Emblème de plusieurs pays andins." },
      { nom: "Tortue géante de Santa Cruz", sci: "Chelonoidis porteri", desc: "Espèce de tortue géante des Galápagos, qui peut vivre plus d'un siècle." },
      { nom: "Anaconda vert", sci: "Eunectes murinus", desc: "Un des plus lourds serpents du monde, qui vit dans les eaux d'Amazonie." },
      { nom: "Ara rouge", sci: "Ara macao", desc: "Perroquet aux plumes rouges, jaunes et bleues." },
      { nom: "Araucaria du Chili", sci: "Araucaria araucana", desc: "Arbre sacré pour le peuple Mapuche, aujourd'hui en danger." },
    ],
    menaces: [
      "La déforestation de l'Amazonie et du Cerrado, principalement due à l'élevage bovin, aux cultures de soja et aux routes.",
      "Les incendies, souvent allumés pour défricher, qui s'aggravent avec les sécheresses.",
      "L'orpaillage illégal, qui détruit les forêts et pollue les rivières au mercure.",
      "Le recul des glaciers andins et le réchauffement, qui bouleversent l'eau douce et les milieux d'altitude.",
      "Le trafic d'animaux sauvages, notamment d'oiseaux, de reptiles et de singes.",
    ],
    pays: ["ARG", "BOL", "BRA", "CHL", "COL", "ECU", "GUY", "PRY", "PER", "SUR", "URY", "VEN", "GUF", "FLK"],
    quiz: [
      {
        question: "Quel fleuve donne son nom à la plus grande forêt tropicale du monde ?",
        options: ["L'Orénoque", "Le Paraná", "L'Amazone", "Le Magdalena"],
        bonne: 2,
        explication: "La forêt amazonienne se développe dans le bassin du fleuve Amazone, le plus puissant du monde par son débit.",
      },
      {
        question: "Quel aliment de base est originaire des Andes ?",
        options: ["Le riz", "La pomme de terre", "Le blé", "Le soja"],
        bonne: 1,
        explication: "La pomme de terre a été domestiquée dans les Andes il y a des milliers d'années.",
      },
      {
        question: "Quel scientifique a visité les Galápagos en 1835 et s'en est inspiré pour sa théorie de l'évolution ?",
        options: ["Charles Darwin", "Louis Pasteur", "Alexander Fleming"],
        bonne: 0,
        explication: "Darwin a observé les différences entre les pinsons et les tortues d'île en île, ce qui l'a mené à l'idée de sélection naturelle.",
      },
      {
        question: "Quelle activité est la principale cause de la déforestation en Amazonie ?",
        options: ["Les volcans", "Le tourisme", "Les tempêtes", "L'élevage de bovins et l'agriculture"],
        bonne: 3,
        explication: "La forêt est coupée surtout pour créer des pâturages et des cultures, comme le soja.",
      },
    ],
  },

  // ------------------------------------------------------------------ ASIE
  {
    id: "asie",
    nom: "Asie",
    emoji: "🌏",
    centre: [90, 40],
    resume: [
      "L'Asie est le plus grand continent du monde et celui qui présente les contrastes les plus forts : toundra et taïga de Sibérie, déserts et steppes d'Asie centrale, plus hautes montagnes du monde dans l'Himalaya, forêts tropicales et mangroves du Sud-Est.",
      "Les forêts tropicales d'Indonésie, de Malaisie et de Thaïlande abritent l'orang-outan, l'éléphant d'Asie et le tigre. La Chine abrite le panda géant dans ses forêts de bambous de montagne. Le lac Baïkal, en Sibérie, est le lac le plus profond du monde et possède de nombreuses espèces uniques.",
      "L'Asie compte aussi le plus grand nombre d'habitants. La demande en terres, en bois et en produits d'origine animale pèse lourdement sur la nature, mais plusieurs pays ont créé de grandes aires protégées et ont réussi à faire remonter certaines populations, comme celles du tigre en Inde.",
    ],
    chiffres: [
      { nom: "Surface de forêts", valeur: "environ 592 millions d'hectares", source: "FAO, Évaluation des ressources forestières mondiales 2020" },
      { nom: "Lac Baïkal", valeur: "environ 20 % de l'eau douce liquide de surface de la planète", source: "UNESCO" },
      { nom: "Orang-outan de Bornéo", valeur: "en danger critique (CR) depuis 2016", source: "UICN, Liste rouge" },
      { nom: "Tigre", valeur: "en danger (EN)", source: "UICN, Liste rouge" },
    ],
    biomes: [
      {
        nom: "Taïga sibérienne",
        desc: "La plus grande forêt du monde, composée de conifères et de bouleaux, aux hivers très rigoureux. Les arbres poussent sur un sol gelé en profondeur, le pergélisol.",
        ou: "Sibérie (Russie), nord de la Mongolie, nord-est de la Chine",
        plantes: [
          { nom: "Mélèze de Sibérie", sci: "Larix sibirica", desc: "Conifère qui perd ses aiguilles en hiver, très résistant au froid." },
          { nom: "Pin de Sibérie", sci: "Pinus sibirica", desc: "Pin dont les graines (pignons) nourrissent oiseaux et mammifères." },
          { nom: "Épicéa de Sibérie", sci: "Picea obovata", desc: "Conifère dominant des forêts sombres de la taïga." },
          { nom: "Bouleau verruqueux", sci: "Betula pendula", desc: "Feuillu pionnier qui colonise les terrains dégagés." },
        ],
        animaux: [
          { nom: "Tigre de l'Amour", sci: "Panthera tigris altaica", desc: "Sous-espèce de tigre adaptée au froid, dans l'Extrême-Orient russe." },
          { nom: "Zibeline", sci: "Martes zibellina", desc: "Petit mustélidé dont la fourrure était recherchée." },
          { nom: "Glouton", sci: "Gulo gulo", desc: "Carnivore robuste capable de survivre dans le froid extrême." },
          { nom: "Ours brun", sci: "Ursus arctos", desc: "Omnivore qui hiberne dans une tanière." },
        ],
      },
      {
        nom: "Forêts tropicales d'Asie du Sud-Est",
        desc: "Forêts très humides où les dipterocarpacées dominent. Elles abritent des plantes spectaculaires et des grands mammifères menacés.",
        ou: "Indonésie (Sumatra, Bornéo), Malaisie, Thaïlande, Viêt Nam, Philippines",
        plantes: [
          { nom: "Shorea à feuilles pâles", sci: "Shorea leprosula", desc: "Grand arbre de la famille des dipterocarpacées, très exploité pour son bois." },
          { nom: "Rafflésie d'Arnold", sci: "Rafflesia arnoldii", desc: "Possède la plus grande fleur du monde, qui sent la viande avariée." },
          { nom: "Népenthès rajah", sci: "Nepenthes rajah", desc: "Plante carnivore de Bornéo, qui capture des insectes et même de petits vertébrés." },
          { nom: "Arum titan", sci: "Amorphophallus titanum", desc: "Sa grande inflorescence, qui peut dépasser 2 m, fleurit rarement." },
        ],
        animaux: [
          { nom: "Orang-outan de Bornéo", sci: "Pongo pygmaeus", desc: "Grand singe roux, très intelligent, qui vit dans les arbres." },
          { nom: "Éléphant d'Asie", sci: "Elephas maximus", desc: "Plus petit que l'éléphant d'Afrique, il a des oreilles plus petites." },
          { nom: "Rhinocéros de Sumatra", sci: "Dicerorhinus sumatrensis", desc: "Plus petit rhinocéros, très poilu, en danger critique." },
          { nom: "Calao rhinocéros", sci: "Buceros rhinoceros", desc: "Grand oiseau au bec surmonté d'un casque, qui disperse des graines." },
        ],
      },
      {
        nom: "Himalaya et plateau tibétain",
        desc: "Les plus hautes montagnes du monde. Les étages de végétation se succèdent de la forêt humide jusqu'aux neiges, et l'air raréfié exige des adaptations fortes.",
        ou: "Népal, Bhoutan, nord de l'Inde, Tibet (Chine)",
        plantes: [
          { nom: "Rhododendron arborescent", sci: "Rhododendron arboreum", desc: "Arbre aux fleurs rouges, fleur nationale du Népal." },
          { nom: "Pavot bleu de l'Himalaya", sci: "Meconopsis betonicifolia", desc: "Fleur d'un bleu intense qui pousse dans les prairies d'altitude." },
          { nom: "Rhubarbe des neiges", sci: "Rheum nobile", desc: "Ses grandes bractées pâles forment une serre qui protège les fleurs du froid." },
          { nom: "Pin de l'Himalaya", sci: "Pinus wallichiana", desc: "Conifère de montagne aux longues aiguilles souples." },
        ],
        animaux: [
          { nom: "Panthère des neiges", sci: "Panthera uncia", desc: "Félin discret des hautes montagnes, à la longue queue et au pelage épais." },
          { nom: "Yak sauvage", sci: "Bos mutus", desc: "Grand bovin des hauts plateaux, adapté au froid." },
          { nom: "Panda roux", sci: "Ailurus fulgens", desc: "Petit mammifère roux des forêts de bambous de montagne." },
          { nom: "Tahr de l'Himalaya", sci: "Hemitragus jemlahicus", desc: "Chèvre sauvage agile sur les pentes escarpées." },
        ],
      },
      {
        nom: "Déserts et steppes d'Asie centrale",
        desc: "Vastes plaines sèches aux hivers froids et aux étés chauds. Les végétaux y sont rares et les animaux migrent ou s'enfouissent.",
        ou: "Mongolie, nord de la Chine (désert de Gobi), Kazakhstan, Ouzbékistan",
        plantes: [
          { nom: "Saxaoul", sci: "Haloxylon ammodendron", desc: "Arbuste du désert dont les racines profondes fixent le sable." },
          { nom: "Stipe de Krylov", sci: "Stipa krylovii", desc: "Herbe dominante des steppes de Mongolie." },
          { nom: "Éphédra de Chine", sci: "Ephedra sinica", desc: "Petit arbuste sans vraies feuilles, utilisé en médecine traditionnelle." },
        ],
        animaux: [
          { nom: "Cheval de Przewalski", sci: "Equus ferus przewalskii", desc: "Dernier cheval sauvage, réintroduit en Mongolie après avoir disparu à l'état sauvage." },
          { nom: "Saïga", sci: "Saiga tatarica", desc: "Antilope au nez en trompe, qui filtre la poussière et réchauffe l'air." },
          { nom: "Gazelle à goitre", sci: "Gazella subgutturosa", desc: "Gazelle rapide des déserts et des steppes." },
          { nom: "Chameau de Bactriane", sci: "Camelus bactrianus", desc: "Chameau à deux bosses, domestiqué, adapté aux hivers froids." },
        ],
      },
    ],
    emblemes: [
      { nom: "Tigre", sci: "Panthera tigris", desc: "Plus grand félin du monde ; sa population a recommencé à augmenter dans plusieurs pays." },
      { nom: "Panda géant", sci: "Ailuropoda melanoleuca", desc: "Vit dans les montagnes du centre de la Chine et mange surtout des pousses de bambou." },
      { nom: "Éléphant d'Asie", sci: "Elephas maximus", desc: "Animal sacré dans plusieurs cultures, menacé par la perte de son habitat." },
      { nom: "Orang-outan de Bornéo", sci: "Pongo pygmaeus", desc: "Son nom signifie « homme de la forêt » en malais." },
      { nom: "Panthère des neiges", sci: "Panthera uncia", desc: "Surnommée le « fantôme des montagnes »." },
      { nom: "Ginkgo", sci: "Ginkgo biloba", desc: "Arbre très ancien, seul survivant de sa lignée, originaire de Chine." },
    ],
    menaces: [
      "La déforestation, notamment pour les plantations de palmiers à huile et de papier en Indonésie et en Malaisie.",
      "Le braconnage et le commerce illégal d'animaux sauvages (pangolins, tigres, éléphants) pour la médecine traditionnelle ou la décoration.",
      "L'urbanisation et les grandes infrastructures (barrages, routes), qui coupent les territoires des animaux.",
      "Le changement climatique : fonte des glaciers himalayens, hausse du niveau de la mer qui menace les mangroves et les deltas.",
      "La surpêche et la pollution des mers côtières, qui touchent les récifs coralliens du Sud-Est asiatique.",
    ],
    pays: [
      "AFG", "ARM", "AZE", "BHR", "BGD", "BTN", "BRN", "KHM", "CHN", "CYP", "GEO", "IND", "IDN", "IRN", "IRQ",
      "ISR", "JPN", "JOR", "KAZ", "KWT", "KGZ", "LAO", "LBN", "MYS", "MDV", "MNG", "MMR", "NPL", "PRK", "OMN",
      "PAK", "PSE", "PHL", "QAT", "SAU", "SGP", "KOR", "LKA", "SYR", "TJK", "THA", "TLS", "TUR", "TKM", "ARE",
      "UZB", "VNM", "YEM", "TWN", "HKG", "MAC",
    ],
    quiz: [
      {
        question: "Dans quelles îles vit l'orang-outan ?",
        options: ["Madagascar et Maurice", "Bornéo et Sumatra", "Honshu et Hokkaido", "Cuba et Haïti"],
        bonne: 1,
        explication: "Les orangs-outans ne vivent à l'état sauvage que dans les forêts de Bornéo et de Sumatra.",
      },
      {
        question: "De quoi se nourrit surtout le panda géant ?",
        options: ["D'insectes", "De fruits", "De pousses de bambou", "De poissons"],
        bonne: 2,
        explication: "Le panda géant passe plus de dix heures par jour à manger du bambou, même s'il est classé parmi les carnivores.",
      },
      {
        question: "Quel félin vit dans les hautes montagnes d'Asie centrale et de l'Himalaya ?",
        options: ["La panthère des neiges", "Le léopard de Java", "Le jaguar", "Le puma"],
        bonne: 0,
        explication: "La panthère des neiges est parfaitement adaptée au froid : longue queue pour l'équilibre et fourrure épaisse.",
      },
      {
        question: "Quel lac de Sibérie est le lac le plus profond du monde ?",
        options: ["Le lac Victoria", "Le lac Balkhach", "Le lac Tchad", "Le lac Baïkal"],
        bonne: 3,
        explication: "Le Baïkal dépasse 1 600 m de profondeur et abrite de nombreuses espèces qu'on ne trouve nulle part ailleurs, comme le phoque du Baïkal.",
      },
    ],
  },

  // ---------------------------------------------------------------- EUROPE
  {
    id: "europe",
    nom: "Europe",
    emoji: "🌍",
    centre: [15, 52],
    resume: [
      "L'Europe est un continent relativement petit, mais aux milieux variés : toundra et forêt boréale au nord, forêts de feuillus au centre, hautes montagnes (Alpes, Pyrénées, Carpates) et climat méditerranéen au sud. Presque tous ses paysages ont été modelés par l'être humain depuis des milliers d'années.",
      "Le bassin méditerranéen est l'un des 36 points chauds de biodiversité de la planète. Il abrite un très grand nombre de plantes qu'on ne trouve nulle part ailleurs, ainsi que des zones humides essentielles pour les oiseaux migrateurs.",
      "Après avoir fortement reculé, certaines espèces reviennent grâce à la protection et à la restauration des milieux : loup, lynx, castor, bison d'Europe. Mais l'agriculture intensive et l'urbanisation restent les principales pressions.",
    ],
    chiffres: [
      { nom: "Surface de forêts (Russie comprise)", valeur: "environ 1 017 millions d'hectares", source: "FAO, Évaluation des ressources forestières mondiales 2020" },
      { nom: "Réseau Natura 2000", valeur: "environ 18 % des terres de l'Union européenne", source: "Agence européenne pour l'environnement" },
      { nom: "Bassin méditerranéen", valeur: "environ 30 000 espèces de plantes, dont 13 000 endémiques", source: "CEPF (Fonds de partenariat pour les écosystèmes critiques)" },
    ],
    biomes: [
      {
        nom: "Forêts tempérées de feuillus",
        desc: "Forêts d'arbres qui perdent leurs feuilles en automne. Elles couvraient presque toute l'Europe de l'Ouest et du Centre avant les grands défrichements.",
        ou: "France, Allemagne, Royaume-Uni, Pologne, Europe centrale",
        plantes: [
          { nom: "Chêne pédonculé", sci: "Quercus robur", desc: "Grand arbre qui peut vivre plusieurs siècles et héberger des centaines d'espèces." },
          { nom: "Hêtre commun", sci: "Fagus sylvatica", desc: "Arbre à l'écorce grise lisse, dont les forêts sont inscrites à l'UNESCO." },
          { nom: "Charme", sci: "Carpinus betulus", desc: "Arbre au bois très dur, souvent taillé en haies." },
          { nom: "Tilleul à petites feuilles", sci: "Tilia cordata", desc: "Arbre mellifère dont les fleurs servent à faire des tisanes." },
        ],
        animaux: [
          { nom: "Cerf élaphe", sci: "Cervus elaphus", desc: "Grand cervidé dont les mâles brament en automne." },
          { nom: "Sanglier", sci: "Sus scrofa", desc: "Omnivore qui fouille le sol à la recherche de racines et de glands." },
          { nom: "Écureuil roux", sci: "Sciurus vulgaris", desc: "Cache des graines en automne, ce qui aide les arbres à se disséminer." },
          { nom: "Pic noir", sci: "Dryocopus martius", desc: "Creuse de grandes cavités, ensuite utilisées par d'autres espèces." },
        ],
      },
      {
        nom: "Forêt boréale et toundra du Nord",
        desc: "Au nord de l'Europe, des forêts de conifères laissent place à la toundra, où seuls poussent des lichens, des mousses et de petits arbustes.",
        ou: "Scandinavie, Finlande, nord de la Russie",
        plantes: [
          { nom: "Épicéa commun", sci: "Picea abies", desc: "Conifère dominant de la forêt boréale, utilisé aussi comme sapin de Noël." },
          { nom: "Pin sylvestre", sci: "Pinus sylvestris", desc: "Pin à l'écorce rougeâtre dans la partie haute du tronc." },
          { nom: "Bouleau nain", sci: "Betula nana", desc: "Petit arbuste de toundra qui ne dépasse pas un mètre." },
          { nom: "Myrtille", sci: "Vaccinium myrtillus", desc: "Petit arbrisseau dont les baies nourrissent ours et oiseaux." },
        ],
        animaux: [
          { nom: "Élan", sci: "Alces alces", desc: "Plus grand cervidé d'Europe, nommé orignal en Amérique du Nord." },
          { nom: "Renne", sci: "Rangifer tarandus", desc: "Cervidé de toundra, élevé par les Samis en Laponie." },
          { nom: "Glouton", sci: "Gulo gulo", desc: "Prédateur et charognard, très résistant au froid." },
          { nom: "Lagopède alpin", sci: "Lagopus muta", desc: "Oiseau dont le plumage devient blanc en hiver." },
        ],
      },
      {
        nom: "Forêts et maquis méditerranéens",
        desc: "Climat aux étés chauds et secs et aux hivers doux. La végétation est dure, souvent parfumée, et s'adapte au feu.",
        ou: "Espagne, Portugal, France du Sud, Italie, Grèce, îles méditerranéennes",
        plantes: [
          { nom: "Olivier", sci: "Olea europaea", desc: "Arbre cultivé depuis des millénaires, qui supporte la sécheresse." },
          { nom: "Chêne-liège", sci: "Quercus suber", desc: "Son écorce épaisse fournit le liège, qui repousse après récolte." },
          { nom: "Chêne vert", sci: "Quercus ilex", desc: "Chêne à feuilles persistantes, typique du Sud." },
          { nom: "Ciste de Montpellier", sci: "Cistus monspeliensis", desc: "Arbuste du maquis aux fleurs blanches, qui repousse vite après le feu." },
        ],
        animaux: [
          { nom: "Lynx pardelle", sci: "Lynx pardinus", desc: "Félin de la péninsule ibérique, sauvé de justesse de l'extinction." },
          { nom: "Aigle impérial ibérique", sci: "Aquila adalberti", desc: "Grand rapide d'Espagne, rare et protégé." },
          { nom: "Tortue d'Hermann", sci: "Testudo hermanni", desc: "Petite tortue terrestre des maquis et des garrigues." },
          { nom: "Genette commune", sci: "Genetta genetta", desc: "Petit carnivore nocturne au pelage tacheté et à la queue annelée." },
        ],
      },
      {
        nom: "Montagnes (Alpes, Pyrénées, Carpates)",
        desc: "L'étagement de la végétation y est très net, avec forêts, pelouses d'altitude, éboulis et neiges. Les espèces d'altitude sont fragilisées par le réchauffement.",
        ou: "Alpes, Pyrénées, Carpates, Apennins",
        plantes: [
          { nom: "Edelweiss", sci: "Leontopodium nivale", desc: "Fleur duveteuse qui pousse sur les pelouses rocheuses calcaires." },
          { nom: "Gentiane acaule", sci: "Gentiana acaulis", desc: "Fleur d'un bleu profond, collée au sol." },
          { nom: "Mélèze d'Europe", sci: "Larix decidua", desc: "Conifère des Alpes qui perd ses aiguilles à l'automne." },
          { nom: "Pin cembro", sci: "Pinus cembra", desc: "Pin de haute altitude, qui dépend du cassenoix pour disperser ses graines." },
        ],
        animaux: [
          { nom: "Bouquetin des Alpes", sci: "Capra ibex", desc: "Chèvre sauvage aux cornes imposantes, réintroduite après avoir presque disparu." },
          { nom: "Chamois", sci: "Rupicapra rupicapra", desc: "Antilope des montagnes agile sur les pentes raides." },
          { nom: "Marmotte des Alpes", sci: "Marmota marmota", desc: "Rongeur qui hiberne plusieurs mois dans un terrier." },
          { nom: "Gypaète barbu", sci: "Gypaetus barbatus", desc: "Grand vautour qui se nourrit d'os, réintroduit dans les Alpes." },
        ],
      },
      {
        nom: "Zones humides et deltas",
        desc: "Marais, lagunes et deltas, riches en oiseaux migrateurs. Ils filtrent l'eau, retiennent les crues et abritent beaucoup d'espèces.",
        ou: "Camargue (France), delta du Danube (Roumanie, Ukraine), Doñana (Espagne)",
        plantes: [
          { nom: "Roseau commun", sci: "Phragmites australis", desc: "Grande graminée aquatique qui forme les roselières." },
          { nom: "Nénuphar blanc", sci: "Nymphaea alba", desc: "Plante aux grandes fleurs blanches qui flottent sur l'eau." },
          { nom: "Saule blanc", sci: "Salix alba", desc: "Arbre qui pousse en bord de rivière et aime les sols humides." },
          { nom: "Iris des marais", sci: "Iris pseudacorus", desc: "Iris jaune qui pousse les pieds dans l'eau." },
        ],
        animaux: [
          { nom: "Flamant rose", sci: "Phoenicopterus roseus", desc: "Filtre l'eau salée pour trouver des crevettes, qui lui donnent sa couleur rose." },
          { nom: "Pélican frisé", sci: "Pelecanus crispus", desc: "Grand oiseau pêcheur qui niche dans le delta du Danube." },
          { nom: "Loutre d'Europe", sci: "Lutra lutra", desc: "Mammifère nageur, indicateur de rivières propres." },
          { nom: "Cistude d'Europe", sci: "Emys orbicularis", desc: "Tortue d'eau douce discrète, qui prend le soleil sur des troncs." },
        ],
      },
    ],
    emblemes: [
      { nom: "Ours brun", sci: "Ursus arctos", desc: "Vit surtout dans les Carpates, les Balkans et en Scandinavie." },
      { nom: "Loup gris", sci: "Canis lupus", desc: "Revenu dans de nombreux pays européens après avoir presque disparu." },
      { nom: "Bison d'Europe", sci: "Bison bonasus", desc: "Plus lourd mammifère terrestre d'Europe, sauvé de l'extinction grâce à l'élevage en captivité." },
      { nom: "Lynx boréal", sci: "Lynx lynx", desc: "Plus grand félin d'Europe, discret et forestier." },
      { nom: "Aigle royal", sci: "Aquila chrysaetos", desc: "Rapace des montagnes qui se nourrit surtout de petits mammifères." },
      { nom: "Chêne pédonculé", sci: "Quercus robur", desc: "Arbre symbole des forêts d'Europe de l'Ouest." },
    ],
    menaces: [
      "L'agriculture intensive : pesticides, engrais et suppression des haies appauvrissent sols, insectes et oiseaux des champs.",
      "L'urbanisation et les infrastructures, qui morcellent les habitats et coupent les routes des animaux.",
      "Le changement climatique : montagnes qui se réchauffent, sécheresses et incendies en région méditerranéenne.",
      "La pollution de l'eau et l'assèchement des zones humides, qui ont fait disparaître une grande part des marais d'origine.",
      "Les espèces envahissantes, comme le frelon asiatique ou la jussie.",
    ],
    pays: [
      "ALB", "AND", "AUT", "BLR", "BEL", "BIH", "BGR", "HRV", "CZE", "DNK", "EST", "FIN", "FRA", "DEU", "GRC",
      "HUN", "ISL", "IRL", "ITA", "LVA", "LIE", "LTU", "LUX", "MLT", "MDA", "MCO", "MNE", "NLD", "MKD", "NOR",
      "POL", "PRT", "ROU", "RUS", "SMR", "SRB", "SVK", "SVN", "ESP", "SWE", "CHE", "UKR", "GBR", "VAT", "FRO",
      "GIB", "IMN", "GGY", "JEY", "ALA", "SJM",
    ],
    quiz: [
      {
        question: "Quel arbre méditerranéen fournit le liège ?",
        options: ["Le pin sylvestre", "Le hêtre", "Le chêne-liège", "L'olivier"],
        bonne: 2,
        explication: "L'écorce du chêne-liège est récoltée tous les neuf à douze ans environ sans abattre l'arbre.",
      },
      {
        question: "Quel est le plus lourd mammifère terrestre sauvage d'Europe ?",
        options: ["L'élan", "Le bison d'Europe", "Le cerf élaphe", "L'ours brun"],
        bonne: 1,
        explication: "Le bison d'Europe peut dépasser 800 kg. Il avait disparu de la nature au début du XXe siècle avant d'être réintroduit.",
      },
      {
        question: "Que protège le réseau Natura 2000 ?",
        options: ["Des sites naturels et des espèces menacées", "Uniquement des monuments historiques", "Les routes européennes", "Les zones de pêche seulement"],
        bonne: 0,
        explication: "Natura 2000 est un réseau de sites choisis pour protéger des habitats et des espèces rares ou menacées dans l'Union européenne.",
      },
      {
        question: "Quel oiseau rose niche dans les étangs de Camargue ?",
        options: ["La cigogne blanche", "Le héron cendré", "Le cygne tuberculé", "Le flamant rose"],
        bonne: 3,
        explication: "La Camargue accueille l'une des rares colonies de reproduction de flamants roses en France.",
      },
    ],
  },

  // --------------------------------------------------------------- OCÉANIE
  {
    id: "oceanie",
    nom: "Océanie",
    emoji: "🌏",
    centre: [140, -25],
    resume: [
      "L'Océanie réunit l'Australie, la Nouvelle-Zélande, la Papouasie-Nouvelle-Guinée et des milliers d'îles du Pacifique. L'Australie et la Nouvelle-Guinée font partie d'un même socle continental, tandis que la Nouvelle-Zélande et les îles du Pacifique sont isolées depuis très longtemps.",
      "Cet isolement a donné une faune et une flore uniques : marsupiaux (kangourous, koalas), monotrèmes (ornithorynque, échidnés) et oiseaux qui ne volent pas, comme le kiwi. L'Australie abrite aussi la plus grande structure construite par des êtres vivants, la Grande Barrière de corail.",
      "Cette isolation rend aussi les espèces très vulnérables aux espèces introduites : chats, renards, rats, hermines. De nombreux programmes de protection, notamment en Nouvelle-Zélande, tentent de les éliminer des îles pour sauver les espèces natives.",
    ],
    chiffres: [
      { nom: "Surface de forêts", valeur: "environ 185 millions d'hectares", source: "FAO, Évaluation des ressources forestières mondiales 2020" },
      { nom: "Espèces endémiques d'Australie", valeur: "plus de 80 % des mammifères, reptiles, grenouilles et plantes vasculaires", source: "Gouvernement australien (DCCEEW)" },
      { nom: "Grande Barrière de corail", valeur: "environ 2 300 km de long, plus de 400 espèces de coraux durs", source: "Great Barrier Reef Marine Park Authority" },
      { nom: "Kākāpō (Nouvelle-Zélande)", valeur: "en danger critique (CR)", source: "UICN, Liste rouge" },
    ],
    biomes: [
      {
        nom: "Outback : déserts et zones arides",
        desc: "Plus de la moitié de l'Australie est aride ou semi-aride. Les pluies sont rares et irrégulières, et la vie s'y adapte en attendant les averses.",
        ou: "Centre et ouest de l'Australie",
        plantes: [
          { nom: "Mulga", sci: "Acacia aneura", desc: "Acacia dont les feuilles guident l'eau de pluie vers les racines." },
          { nom: "Spinifex", sci: "Triodia irritans", desc: "Herbe piquante en touffes rondes, très répandue dans le désert." },
          { nom: "Pois de Sturt", sci: "Swainsona formosa", desc: "Fleur rouge qui fleurit après les rares pluies." },
          { nom: "Eucalyptus rouge des rivières", sci: "Eucalyptus camaldulensis", desc: "Grand arbre qui borde les rivières temporaires du désert." },
        ],
        animaux: [
          { nom: "Kangourou roux", sci: "Osphranter rufus", desc: "Plus grand marsupial du monde, qui se déplace par bonds." },
          { nom: "Dragon barbu", sci: "Pogona vitticeps", desc: "Lézard capable de gonfler sa gorge en barbe pour impressionner." },
          { nom: "Diable cornu", sci: "Moloch horridus", desc: "Lézard épineux qui récolte la rosée sur sa peau pour boire." },
          { nom: "Émeu d'Australie", sci: "Dromaius novaehollandiae", desc: "Grand oiseau coureur qui ne vole pas." },
        ],
      },
      {
        nom: "Forêts d'eucalyptus et forêts tempérées",
        desc: "Les eucalyptus dominent la plupart des forêts d'Australie. Leurs feuilles huileuses brûlent facilement, mais ils se régénèrent après le feu.",
        ou: "Est et sud-est de l'Australie, Tasmanie",
        plantes: [
          { nom: "Eucalyptus royal", sci: "Eucalyptus regnans", desc: "Un des plus grands arbres à fleurs du monde." },
          { nom: "Banksia dentelé", sci: "Banksia serrata", desc: "Arbre aux épis de fleurs, dont les cônes s'ouvrent après un incendie." },
          { nom: "Hêtre myrte", sci: "Nothofagus cunninghamii", desc: "Arbre des forêts humides de Tasmanie et du Victoria." },
        ],
        animaux: [
          { nom: "Koala", sci: "Phascolarctos cinereus", desc: "Marsupial qui se nourrit presque uniquement de feuilles d'eucalyptus." },
          { nom: "Wombat commun", sci: "Vombatus ursinus", desc: "Marsupial fouisseur aux crottes en forme de cubes." },
          { nom: "Ornithorynque", sci: "Ornithorhynchus anatinus", desc: "Mammifère qui pond des œufs et a un bec de canard." },
          { nom: "Martin-chasseur géant", sci: "Dacelo novaeguineae", desc: "Oiseau connu pour son cri qui ressemble à un rire (kookaburra)." },
        ],
      },
      {
        nom: "Forêts tropicales de Nouvelle-Guinée et du Queensland",
        desc: "Forêts humides très riches en espèces. La Nouvelle-Guinée est l'une des régions les moins explorées de la planète et on y découvre régulièrement de nouvelles espèces.",
        ou: "Papouasie-Nouvelle-Guinée, nord-est de l'Australie (Queensland)",
        plantes: [
          { nom: "Fougère arborescente de Cooper", sci: "Cyathea cooperi", desc: "Grande fougère dont le tronc peut atteindre plusieurs mètres." },
          { nom: "Kauri du Queensland", sci: "Agathis robusta", desc: "Conifère géant des forêts du nord-est de l'Australie." },
          { nom: "Orchidée de Nouvelle-Guinée", sci: "Dendrobium phalaenopsis", desc: "Orchidée aux fleurs roses, l'emblème floral du Queensland." },
        ],
        animaux: [
          { nom: "Casoar à casque", sci: "Casuarius casuarius", desc: "Grand oiseau coureur à casque, qui disperse les graines de nombreux arbres." },
          { nom: "Paradisier de Raggi", sci: "Paradisaea raggiana", desc: "Oiseau de paradis aux plumes orange spectaculaires, emblème de la Papouasie-Nouvelle-Guinée." },
          { nom: "Dendrolague de Goodfellow", sci: "Dendrolagus goodfellowi", desc: "Kangourou qui grimpe aux arbres." },
        ],
      },
      {
        nom: "Forêts de Nouvelle-Zélande",
        desc: "Isolée depuis plus de 80 millions d'années, la Nouvelle-Zélande n'avait presque pas de mammifères terrestres : les oiseaux y occupaient des rôles tenus ailleurs par des mammifères.",
        ou: "Nouvelle-Zélande (îles du Nord et du Sud)",
        plantes: [
          { nom: "Kauri de Nouvelle-Zélande", sci: "Agathis australis", desc: "Conifère géant qui peut vivre plus de mille ans." },
          { nom: "Fougère argentée", sci: "Cyathea dealbata", desc: "Fougère arborescente à revers argenté, emblème sportif du pays." },
          { nom: "Pōhutukawa", sci: "Metrosideros excelsa", desc: "Arbre côtier aux fleurs rouges qui fleurit vers Noël." },
          { nom: "Rimu", sci: "Dacrydium cupressinum", desc: "Conifère élevé aux branches retombantes." },
        ],
        animaux: [
          { nom: "Kiwi brun", sci: "Apteryx mantelli", desc: "Oiseau nocturne qui ne vole pas, au long bec sensible à l'odeur." },
          { nom: "Kākāpō", sci: "Strigops habroptilus", desc: "Seul perroquet qui ne vole pas, en danger critique." },
          { nom: "Tuatara", sci: "Sphenodon punctatus", desc: "Reptile qui ressemble à un lézard, seul survivant d'un groupe très ancien." },
          { nom: "Kéa", sci: "Nestor notabilis", desc: "Perroquet de montagne très curieux et intelligent." },
        ],
      },
      {
        nom: "Récifs coralliens et herbiers",
        desc: "Les récifs occupent une petite fraction des océans mais abritent un grand nombre d'espèces marines. Le blanchissement dû à l'eau trop chaude les menace.",
        ou: "Grande Barrière de corail (Australie), Nouvelle-Calédonie, Fidji, Polynésie",
        plantes: [
          { nom: "Posidonie d'Australie", sci: "Posidonia australis", desc: "Plante marine à fleurs, qui forme de vastes herbiers." },
          { nom: "Halophile ovale", sci: "Halophila ovalis", desc: "Herbier marin qui nourrit tortues et dugongs." },
          { nom: "Palétuvier à longues racines", sci: "Rhizophora stylosa", desc: "Arbre de mangrove dont les racines échasses protègent la côte." },
        ],
        animaux: [
          { nom: "Corail Acropora", sci: "Acropora millepora", desc: "Corail dur qui construit le récif grâce à des algues vivant dans ses tissus." },
          { nom: "Tortue verte", sci: "Chelonia mydas", desc: "Tortue marine herbivore, qui revient pondre sur la plage où elle est née." },
          { nom: "Poisson-clown orange", sci: "Amphiprion percula", desc: "Poisson qui vit protégé entre les tentacules d'une anémone." },
          { nom: "Bénitier géant", sci: "Tridacna gigas", desc: "Plus grand mollusque bivalve du monde." },
        ],
      },
    ],
    emblemes: [
      { nom: "Kangourou roux", sci: "Osphranter rufus", desc: "Symbole de l'Australie." },
      { nom: "Koala", sci: "Phascolarctos cinereus", desc: "Marsupial arboricole menacé par la perte des forêts et les incendies." },
      { nom: "Ornithorynque", sci: "Ornithorhynchus anatinus", desc: "Mammifère qui pond des œufs et chasse avec son bec sensible aux champs électriques." },
      { nom: "Kiwi brun", sci: "Apteryx mantelli", desc: "Oiseau emblème de la Nouvelle-Zélande." },
      { nom: "Kākāpō", sci: "Strigops habroptilus", desc: "Un des perroquets les plus rares du monde, suivi de près par des programmes de conservation." },
      { nom: "Eucalyptus royal", sci: "Eucalyptus regnans", desc: "Arbre géant des forêts du sud-est de l'Australie." },
    ],
    menaces: [
      "Les espèces introduites : chats, renards, rats et hermines ont fait disparaître de nombreux oiseaux et petits mammifères natifs.",
      "Le changement climatique : le blanchissement des coraux de la Grande Barrière s'est répété ces dernières années, et les feux de brousse sont plus intenses.",
      "Le défrichement pour l'agriculture et l'élevage, en Australie, ainsi que l'exploitation forestière en Papouasie-Nouvelle-Guinée.",
      "La hausse du niveau de la mer, qui menace les îles basses du Pacifique et leurs écosystèmes côtiers.",
    ],
    pays: [
      "AUS", "NZL", "PNG", "FJI", "SLB", "VUT", "WSM", "TON", "KIR", "TUV", "NRU", "MHL", "FSM", "PLW", "NCL",
      "PYF", "GUM", "MNP", "ASM", "COK", "NIU", "TKL", "WLF", "PCN", "NFK", "CCK", "CXR", "HMD",
    ],
    quiz: [
      {
        question: "Quel mammifère australien pond des œufs ?",
        options: ["Le koala", "L'ornithorynque", "Le wombat", "Le kangourou"],
        bonne: 1,
        explication: "L'ornithorynque et les échidnés sont des monotrèmes : des mammifères qui pondent des œufs.",
      },
      {
        question: "Dans quel pays vit le kiwi, oiseau qui ne vole pas ?",
        options: ["L'Australie", "Fidji", "La Nouvelle-Zélande", "Le Chili"],
        bonne: 2,
        explication: "Le kiwi est endémique de la Nouvelle-Zélande, qui n'avait presque pas de mammifères terrestres avant l'arrivée des humains.",
      },
      {
        question: "Par quoi la Grande Barrière de corail est-elle construite ?",
        options: ["Par des coraux (de minuscules animaux)", "Par des algues géantes", "Par des éponges", "Par des volcans"],
        bonne: 0,
        explication: "Les coraux sont des animaux. Leurs squelettes calcaires s'accumulent pendant des milliers d'années et forment le récif.",
      },
      {
        question: "De quoi se nourrit presque uniquement le koala ?",
        options: ["De fruits", "D'insectes", "De bambou", "De feuilles d'eucalyptus"],
        bonne: 3,
        explication: "Le koala mange des feuilles d'eucalyptus, peu nourrissantes, ce qui le pousse à dormir une vingtaine d'heures par jour.",
      },
    ],
  },

  // ------------------------------------------------------------ ANTARCTIQUE
  {
    id: "antarctique",
    nom: "Antarctique",
    emoji: "🧊",
    centre: [0, -80],
    resume: [
      "L'Antarctique est le continent le plus froid, le plus venteux et le plus sec de la planète. Il est presque entièrement recouvert par une calotte glaciaire qui contient la plus grande part de la glace du monde. Il n'a pas d'habitants permanents, seulement des scientifiques dans des stations de recherche.",
      "Sur terre, la vie se limite aux côtes et à quelques vallées sans glace : lichens, mousses, minuscules invertébrés et seulement deux plantes à fleurs. La vraie richesse est dans l'océan Austral, où le krill, petit crustacé, nourrit baleines, phoques, manchots et poissons.",
      "Le continent est protégé par le Traité sur l'Antarctique et le Protocole de Madrid, qui le réservent à la paix et à la science. Il subit pourtant les effets du changement climatique, en particulier sur la péninsule Antarctique, qui se réchauffe vite.",
    ],
    chiffres: [
      { nom: "Superficie", valeur: "environ 14 millions de km²", source: "SCAR (Comité scientifique pour la recherche en Antarctique)" },
      { nom: "Part de la glace de la planète", valeur: "environ 90 %", source: "NSIDC (Centre américain de données sur la neige et la glace)" },
      { nom: "Plantes à fleurs", valeur: "2 espèces seulement", source: "British Antarctic Survey" },
      { nom: "Protocole de Madrid", valeur: "adopté en 1991 ; interdit les activités minières", source: "Secrétariat du Traité sur l'Antarctique" },
    ],
    biomes: [
      {
        nom: "Côtes et îles de la péninsule Antarctique",
        desc: "Zone la plus douce du continent, avec des étés autour de 0 °C. Les colonies d'oiseaux de mer et de phoques s'y installent sur les roches libres de glace.",
        ou: "Péninsule Antarctique, îles Shetland du Sud, côtes de la mer de Weddell",
        plantes: [
          { nom: "Canche antarctique", sci: "Deschampsia antarctica", desc: "L'une des deux seules plantes à fleurs d'Antarctique." },
          { nom: "Colobanthe de Quito", sci: "Colobanthus quitensis", desc: "Petite plante en coussin, seconde plante à fleurs du continent." },
          { nom: "Lichen antarctique", sci: "Usnea antarctica", desc: "Lichen en filaments qui pousse sur les roches côtières." },
          { nom: "Mousse argentée", sci: "Bryum argenteum", desc: "Mousse présente sur tous les continents, y compris en Antarctique." },
        ],
        animaux: [
          { nom: "Manchot Adélie", sci: "Pygoscelis adeliae", desc: "Petit manchot qui niche sur la côte en construisant un nid de cailloux." },
          { nom: "Manchot papou", sci: "Pygoscelis papua", desc: "Reconnaissable à la tache blanche au-dessus des yeux, c'est un nageur rapide." },
          { nom: "Phoque de Weddell", sci: "Leptonychotes weddellii", desc: "Phoque plongeur qui vit plus au sud que tout autre mammifère." },
          { nom: "Labbe antarctique", sci: "Stercorarius antarcticus", desc: "Oiseau prédateur qui vole les œufs et les poussins." },
        ],
      },
      {
        nom: "Océan Austral et banquise",
        desc: "L'océan qui entoure le continent est très riche. L'été, des algues microscopiques y prolifèrent et nourrissent le krill, base de toute la chaîne alimentaire.",
        ou: "Eaux autour de l'Antarctique, au sud du 60e parallèle",
        plantes: [
          { nom: "Phéocystis antarctique", sci: "Phaeocystis antarctica", desc: "Algue microscopique qui forme de grandes colonies." },
          { nom: "Diatomée Fragilariopsis", sci: "Fragilariopsis kerguelensis", desc: "Algue à squelette de silice, très abondante dans l'océan Austral." },
          { nom: "Diatomée Chaetoceros", sci: "Chaetoceros dichaeta", desc: "Algue microscopique en chaîne, nourriture du krill." },
        ],
        animaux: [
          { nom: "Krill antarctique", sci: "Euphausia superba", desc: "Petit crustacé en énormes essaims, base du réseau alimentaire." },
          { nom: "Baleine à bosse", sci: "Megaptera novaeangliae", desc: "Vient se nourrir de krill en été dans les eaux polaires." },
          { nom: "Léopard de mer", sci: "Hydrurga leptonyx", desc: "Phoque prédateur qui chasse des manchots et des phoques plus petits." },
          { nom: "Légine antarctique", sci: "Dissostichus mawsoni", desc: "Grand poisson dont le sang contient des protéines antigel." },
        ],
      },
      {
        nom: "Vallées sèches et intérieur du continent",
        desc: "Déserts extrêmes de froid et de sécheresse, parmi les plus hostiles de la Terre. Seule une vie minuscule survit dans les sols et sous les roches.",
        ou: "Vallées sèches de McMurdo (Terre Victoria), intérieur du continent",
        plantes: [
          { nom: "Lichen Buellia", sci: "Buellia frigida", desc: "Lichen qui forme une croûte sur les roches." },
          { nom: "Mousse argentée", sci: "Bryum argenteum", desc: "Mousse très résistante, présente dans des oasis libres de glace." },
          { nom: "Lichen orange", sci: "Xanthoria elegans", desc: "Lichen coloré, capable de survivre au froid et à la sécheresse." },
        ],
        animaux: [
          { nom: "Nématode des sols", sci: "Scottnema lindsayae", desc: "Minuscule ver, animal le plus abondant dans les sols des vallées sèches." },
          { nom: "Collembole des vallées sèches", sci: "Gomphiocephalus hodgsoni", desc: "Minuscule arthropode qui se nourrit de micro-organismes du sol." },
          { nom: "Acarien Stereotydeus", sci: "Stereotydeus mollis", desc: "Minuscule acarien qui vit sous les pierres." },
        ],
      },
    ],
    emblemes: [
      { nom: "Manchot empereur", sci: "Aptenodytes forsteri", desc: "Seul manchot à se reproduire pendant l'hiver antarctique, les mâles couvant l'œuf sur leurs pieds." },
      { nom: "Manchot Adélie", sci: "Pygoscelis adeliae", desc: "Un des manchots les plus abondants du continent." },
      { nom: "Krill antarctique", sci: "Euphausia superba", desc: "Petit crustacé dont la masse totale est énorme et nourrit tout l'océan Austral." },
      { nom: "Léopard de mer", sci: "Hydrurga leptonyx", desc: "Grand prédateur de l'océan polaire." },
      { nom: "Canche antarctique", sci: "Deschampsia antarctica", desc: "Plante à fleurs qui pousse sur la péninsule Antarctique, plus abondante avec le réchauffement." },
      { nom: "Baleine à bosse", sci: "Megaptera novaeangliae", desc: "Migre chaque année entre les eaux tropicales et les eaux polaires." },
    ],
    menaces: [
      "Le réchauffement climatique, surtout sur la péninsule Antarctique : fonte de la glace, recul de la banquise et perte d'habitat pour le krill et les manchots.",
      "La pêche du krill et de la légine, qui doit être limitée pour ne pas priver baleines, phoques et manchots de leur nourriture.",
      "Le tourisme et les stations de recherche, qui peuvent perturber les colonies et introduire des espèces étrangères.",
      "L'acidification des océans, due au CO2 absorbé par l'eau, qui fragilise les organismes à coquille.",
    ],
    pays: [],
    quiz: [
      {
        question: "Quel manchot se reproduit pendant l'hiver antarctique ?",
        options: ["Le manchot Adélie", "Le manchot papou", "Le manchot empereur", "Le manchot de Magellan"],
        bonne: 2,
        explication: "Le manchot empereur pond en plein hiver. Le mâle couve l'œuf sur ses pieds pendant que la femelle part pêcher.",
      },
      {
        question: "Quel petit animal est à la base du réseau alimentaire de l'océan Austral ?",
        options: ["Le krill", "Le calmar géant", "La méduse", "La sardine"],
        bonne: 0,
        explication: "Le krill se nourrit d'algues microscopiques et il est mangé par les baleines, les phoques, les manchots et les poissons.",
      },
      {
        question: "Combien d'espèces de plantes à fleurs poussent naturellement en Antarctique ?",
        options: ["Aucune", "Deux", "Une centaine", "Des milliers"],
        bonne: 1,
        explication: "Il n'y en a que deux : la canche antarctique et le colobanthe de Quito, qui poussent sur la péninsule.",
      },
      {
        question: "Que prévoit le Protocole de Madrid adopté en 1991 ?",
        options: ["L'exploitation du pétrole", "La pêche illimitée", "La construction de villes", "L'interdiction des activités minières"],
        bonne: 3,
        explication: "Le Protocole protège l'environnement de l'Antarctique et interdit toute activité minière, sauf la recherche scientifique.",
      },
    ],
  },
]
