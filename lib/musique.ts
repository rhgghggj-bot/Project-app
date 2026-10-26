// « Anglais en musique » : des classiques (années 60 à aujourd'hui) pour apprendre
// l'anglais. Aucune parole n'est recopiée : seulement des mots ou expressions isolés,
// expliqués, et un résumé du sens écrit avec nos mots. La musique se lit via le clip
// officiel sur YouTube ; les paroles complètes sont sur Spotify / Apple Music.

export type Niveau = "A2" | "B1" | "B2"
export type Mot = { en: string; fr: string; explication: string; niveau: Niveau }
export type Question = { question: string; choix: [string, string, string, string]; bonne: number; explication: string }
export type Decennie = "60s" | "70s" | "80s" | "90s" | "2000s" | "2010s" | "2020s"

export type Chanson = {
  id: string            // identifiant du clip officiel sur YouTube
  titre: string
  artiste: string
  annee: number
  decennie: Decennie
  style: string
  duree: string
  chaine: string        // chaîne YouTube officielle
  demande?: boolean     // demandée par l'élève
  histoire: string
  sujet: string
  mots: Mot[]
  quiz: Question[]
}

export const DECENNIES: Decennie[] = ["60s", "70s", "80s", "90s", "2000s", "2010s", "2020s"]

const q = (question: string, choix: [string, string, string, string], bonne: number, explication: string): Question => ({ question, choix, bonne, explication })
const m = (en: string, fr: string, explication: string, niveau: Niveau): Mot => ({ en, fr, explication, niveau })

export const CHANSONS: Chanson[] = [
  // ───────── Les demandes de l'élève ─────────
  {
    id: "_WcWHZc8s2I", titre: "No Ordinary Love", artiste: "Sade", annee: 1992, decennie: "90s", style: "Soul / Quiet storm", duree: "4:02", chaine: "Sade", demande: true,
    histoire: "Sade est un groupe britannique dont la chanteuse, Sade Adu, est née au Nigeria. « No Ordinary Love » est sortie en 1992 sur l'album Love Deluxe. Le style est doux et lent, très « soul ».",
    sujet: "La chanson parle d'un amour si fort et si rare qu'on ne peut pas le comparer aux autres. La voix raconte aussi la peur de le perdre.",
    mots: [
      m("ordinary", "ordinaire", "Le contraire de « special ». « No ordinary love » = un amour pas comme les autres.", "A2"),
      m("no ordinary …", "pas un … ordinaire", "On met « no » devant un nom pour dire qu'il est vraiment spécial.", "B1"),
      m("love", "amour / aimer", "Peut être un nom (« love ») ou un verbe (« to love »).", "A2"),
      m("deep", "profond", "Se dit d'un sentiment, d'une eau, d'une voix. « Deep feelings » = des sentiments profonds.", "A2"),
      m("to lose", "perdre", "Verbe irrégulier : lose, lost, lost. À ne pas confondre avec « loose » (lâche).", "A2"),
      m("to cherish", "chérir", "Aimer très fort et prendre soin. Mot littéraire, joli dans une chanson d'amour.", "B2"),
      m("rare", "rare", "Ressemble au français ; sert à dire qu'une chose se trouve peu.", "A2"),
      m("to last", "durer", "« Our love will last » = notre amour durera. Autre sens : « last » = dernier.", "B1"),
    ],
    quiz: [
      q("Que veut dire « ordinary » ?", ["ordinaire", "orange", "ordonné", "original"], 0, "« Ordinary » = ordinaire, banal. Attention : « ordinaire » ressemble au mot français, ce n'est pas un faux ami."),
      q("« No ordinary love » signifie…", ["Pas d'amour du tout", "Un amour pas comme les autres", "Un amour ordinaire", "Un ancien amour"], 1, "« No » + nom = ce n'est surtout pas un simple … : ici, un amour exceptionnel."),
      q("Quel est le passé de « to lose » ?", ["losed", "loosed", "lost", "lose"], 2, "Verbe irrégulier : lose, lost, lost."),
    ],
  },
  {
    id: "e2Ljkr9NmOg", titre: "Love Is Stronger Than Pride", artiste: "Sade", annee: 1988, decennie: "80s", style: "Soul / Jazz-pop", duree: "4:22", chaine: "Sade", demande: true,
    histoire: "Cette chanson de Sade est sortie en 1988 sur l'album Stronger Than Pride, dont elle porte presque le titre. Le groupe est britannique et la chanteuse est née au Nigeria.",
    sujet: "L'amour est plus fort que l'orgueil : pour sauver une relation, il faut parfois savoir mettre sa fierté de côté et accepter de pardonner.",
    mots: [
      m("pride", "fierté / orgueil", "Peut être positif (être fier de soi) ou négatif (orgueil). Verbe lié : « to be proud ».", "B1"),
      m("stronger than", "plus fort que", "Comparatif : adjectif court + « -er than ». « Stronger than pride » = plus fort que l'orgueil.", "A2"),
      m("strong", "fort", "Adjectif de base ; le comparatif est « stronger », le superlatif « the strongest ».", "A2"),
      m("to forgive", "pardonner", "Verbe irrégulier : forgive, forgave, forgiven.", "B1"),
      m("to give in", "céder", "Accepter de perdre une dispute. Verbe à particule.", "B2"),
      m("to hurt", "faire mal / blesser", "Invariable : hurt, hurt, hurt. Peut être physique ou émotionnel.", "B1"),
      m("to hold on", "tenir bon / s'accrocher", "Ne pas lâcher, garder espoir.", "B1"),
    ],
    quiz: [
      q("Comment dit-on « plus fort que » ?", ["more strong than", "stronger than", "strongest than", "as strong"], 1, "Adjectif court : on ajoute « -er » puis « than »."),
      q("« Pride » veut dire…", ["la prière", "le prix", "la fierté / l'orgueil", "la peur"], 2, "« Pride » = fierté ou orgueil. Le prix se dit « price » ou « prize »."),
      q("« To forgive » signifie…", ["oublier", "pardonner", "prêter", "promettre"], 1, "To forgive = pardonner (forgive, forgave, forgiven)."),
    ],
  },
  {
    id: "sOnqjkJTMaA", titre: "Thriller", artiste: "Michael Jackson", annee: 1982, decennie: "80s", style: "Pop / Funk", duree: "13:42", chaine: "Michael Jackson", demande: true,
    histoire: "« Thriller » est le morceau-titre de l'album sorti en 1982, écrit par Rod Temperton. Son clip, réalisé par John Landis et sorti en 1983, dure environ quatorze minutes et ressemble à un petit film d'horreur. La voix de l'acteur Vincent Price y parle sur la chanson.",
    sujet: "La chanson joue avec les histoires de peur : la nuit, des monstres surgissent et on ne peut pas leur échapper. Le ton est à la fois effrayant et drôle, comme dans un film d'épouvante.",
    mots: [
      m("thriller", "film ou roman à suspense", "Une histoire qui fait peur ou donne des frissons.", "B1"),
      m("midnight", "minuit", "Mot composé : mid + night. Heure des histoires de fantômes.", "A2"),
      m("to scream", "crier / hurler", "Crier fort, souvent de peur.", "B1"),
      m("ghost", "fantôme", "Se prononce « goast ». Un esprit qui revient.", "A2"),
      m("monster", "monstre", "Ressemble au français.", "A2"),
      m("to be scared", "avoir peur", "On dit « I'm scared of … » (j'ai peur de…). Ne pas dire « I have fear ».", "A2"),
      m("to run away", "s'enfuir", "Courir pour échapper à quelque chose.", "B1"),
      m("spooky", "qui fait peur (famil.)", "Adjectif courant pour Halloween ; plus léger que « scary ».", "B2"),
    ],
    quiz: [
      q("Un « thriller », c'est…", ["Une comédie", "Un film à suspense", "Un dessin animé", "Un documentaire"], 1, "Un thriller est une histoire à suspense qui donne des frissons."),
      q("Comment dit-on « J'ai peur » ?", ["I have fear", "I am scared", "I fear me", "I scare"], 1, "On utilise « to be scared (of) »."),
      q("« Midnight » correspond à quelle heure ?", ["midi", "minuit", "6 heures", "22 heures"], 1, "Midnight = minuit (12 a.m.). Midi se dit « noon »."),
    ],
  },
  {
    id: "izGwDsrQ1eQ", titre: "Careless Whisper", artiste: "George Michael", annee: 1984, decennie: "80s", style: "Pop / Saxophone ballad", duree: "5:01", chaine: "George Michael", demande: true,
    histoire: "Sortie en 1984, la chanson est signée George Michael et Andrew Ridgeley, du duo Wham!. Elle est célèbre pour son riff de saxophone. Elle figure sur l'album « Ladies & Gentlemen: The Best of George Michael » (1998).",
    sujet: "Le narrateur regrette d'avoir trahi la confiance de la personne qu'il aime. Il comprend trop tard qu'une erreur peut tout gâcher, et il se sent coupable.",
    mots: [
      m("careless", "négligent / imprudent", "care + -less (sans) : « sans soin ». Le contraire est « careful ».", "B1"),
      m("whisper", "chuchoter / chuchotement", "Parler très bas. Le « wh » se prononce comme « w ».", "B1"),
      m("-less", "sans", "Suffixe : careless, homeless, hopeless. Le contraire est « -ful ».", "B1"),
      m("guilty", "coupable", "Se sentir coupable : « to feel guilty ».", "B1"),
      m("to regret", "regretter", "Ressemble au français. « I regret it » = je le regrette.", "B1"),
      m("to trust", "faire confiance", "Aussi un nom : « trust » = la confiance.", "A2"),
      m("too late", "trop tard", "« Too » = trop. À ne pas confondre avec « to » ou « two ».", "A2"),
      m("to dance", "danser", "Verbe simple, souvent présent dans les chansons.", "A2"),
    ],
    quiz: [
      q("« Careless » veut dire…", ["plein de soin", "sans soin, négligent", "attentionné", "inquiet"], 1, "Le suffixe « -less » veut dire « sans »."),
      q("Quel mot est le contraire de « careless » ?", ["careful", "useless", "homeless", "carefree"], 0, "« Careful » = prudent, attentif. Le suffixe « -ful » est l'opposé de « -less »."),
      q("Que veut dire « to whisper » ?", ["crier", "chanter", "chuchoter", "siffler"], 2, "To whisper = chuchoter, parler très bas."),
    ],
  },
  {
    id: "6Cs3Pvmmv0E", titre: "Faith", artiste: "George Michael", annee: 1987, decennie: "80s", style: "Pop / Rock", duree: "3:44", chaine: "George Michael", demande: true,
    histoire: "« Faith » est le morceau-titre du premier album solo de George Michael, sorti en 1987. Le single a été numéro un du classement américain Billboard Hot 100 en 1988. Il figure sur « Ladies & Gentlemen: The Best of George Michael ».",
    sujet: "Le chanteur dit qu'il veut une relation honnête, pas un simple jeu. Il demande qu'on lui donne du temps et de la confiance avant de se lancer.",
    mots: [
      m("faith", "foi / confiance", "Croire en quelqu'un ou en quelque chose, sans preuve.", "B1"),
      m("to believe", "croire", "« Believe in » = croire en. « Believe » ne prend pas de -ing à la forme simple.", "A2"),
      m("to wait", "attendre", "« Wait for » + quelque chose : « I wait for you ». Pas de « attend » !", "A2"),
      m("to take time", "prendre son temps", "« It takes time » = ça prend du temps.", "A2"),
      m("honest", "honnête", "Le « h » ne se prononce pas : « onest ».", "B1"),
      m("a game", "un jeu", "Au sens figuré, une relation où l'on ne joue pas franc jeu.", "A2"),
      m("to be ready", "être prêt", "Souvent suivi de « to » + verbe : « ready to go ».", "A2"),
    ],
    quiz: [
      q("« Faith » se traduit par…", ["foi / confiance", "fidélité", "fatigue", "faim"], 0, "Faith = foi, confiance. « Fidélité » se dit « loyalty »."),
      q("Comment dit-on « attendre quelqu'un » ?", ["to attend someone", "to wait for someone", "to expect for someone", "to await to someone"], 1, "« Attend » est un faux ami (= assister à). On dit « to wait for »."),
      q("Dans « honest », quelle lettre ne se prononce pas ?", ["le h", "le s", "le t", "le n"], 0, "Le « h » est muet : « onest »."),
    ],
  },
  {
    id: "diYAc7gB-0A", titre: "Freedom! '90", artiste: "George Michael", annee: 1990, decennie: "90s", style: "Pop / Funk", duree: "6:40", chaine: "George Michael", demande: true,
    histoire: "La chanson est sortie en 1990, sur l'album Listen Without Prejudice Vol. 1, et elle figure sur « Ladies & Gentlemen ». Dans son clip, George Michael n'apparaît pas : ce sont des top models qui chantent à l'écran.",
    sujet: "George Michael parle de sa vie de star : il veut être libre de choisir qui il est et de ne plus jouer un rôle. La chanson est une envie de liberté et d'authenticité.",
    mots: [
      m("freedom", "liberté", "free + -dom. Autres mots en -dom : kingdom, boredom, wisdom.", "A2"),
      m("free", "libre / gratuit", "Deux sens : sans prix ou sans contrainte.", "A2"),
      m("fame", "la célébrité", "Adjectif : « famous ». « Fame » = être connu de tous.", "B1"),
      m("to be yourself", "être soi-même", "« Yourself » est réfléchi : « Be yourself ! »", "A2"),
      m("a mask", "un masque", "Au sens figuré : cacher qui on est vraiment.", "B1"),
      m("to move on", "passer à autre chose", "Avancer après une période de la vie.", "B2"),
      m("to choose", "choisir", "Verbe irrégulier : choose, chose, chosen.", "B1"),
    ],
    quiz: [
      q("« Freedom » veut dire…", ["la gratuité", "la liberté", "la fraîcheur", "l'amitié"], 1, "Freedom = liberté. « Free » signifie libre ou gratuit."),
      q("« Fame » se traduit par…", ["la famille", "la faim", "la célébrité", "la peur"], 2, "Fame = célébrité. Famille = « family », faim = « hunger »."),
      q("Quel est le participe passé de « to choose » ?", ["choosed", "chosen", "chose", "choosen"], 1, "Choose, chose, chosen."),
    ],
  },
  {
    id: "SHAQlFq6TFg", titre: "Fastlove", artiste: "George Michael", annee: 1996, decennie: "90s", style: "Pop / R&B", duree: "5:05", chaine: "George Michael", demande: true,
    histoire: "« Fastlove » est un single de 1996, tiré de l'album Older, et il figure sur « Ladies & Gentlemen: The Best of George Michael ». Le style mélange pop et R&B.",
    sujet: "Le narrateur parle de relations rapides et de soirées où l'on cherche une compagnie de passage, tout en se demandant si c'est vraiment ce qu'il veut.",
    mots: [
      m("fast", "rapide / vite", "Adjectif et adverbe à la fois : « a fast car », « he runs fast ».", "A2"),
      m("fast food", "restauration rapide", "Mot courant, utilisé aussi en français.", "A2"),
      m("lonely", "seul (et triste)", "Différent de « alone » (seul, simplement sans personne).", "B1"),
      m("to look for", "chercher", "Verbe à particule. « Look at » = regarder.", "A2"),
      m("a night out", "une soirée dehors", "Sortir le soir avec des amis : « to go out ».", "B1"),
      m("to feel like", "avoir envie de", "« I feel like dancing » = j'ai envie de danser.", "B2"),
      m("to rush", "se dépêcher", "Aller trop vite. « Don't rush ! » = ne te précipite pas.", "B1"),
    ],
    quiz: [
      q("« Fast » peut vouloir dire…", ["vite et rapide", "lent", "gros", "fort"], 0, "Fast = rapide (adjectif) ou vite (adverbe)."),
      q("Quelle est la différence entre « lonely » et « alone » ?", ["Aucune", "« lonely » = triste d'être seul", "« alone » = triste d'être seul", "« lonely » = avec des amis"], 1, "Lonely suggère un sentiment de solitude ; alone dit seulement qu'on est seul."),
      q("« I feel like dancing » veut dire…", ["Je me sens comme un danseur", "J'ai envie de danser", "Je suis en train de danser", "Je sais danser"], 1, "« Feel like + -ing » = avoir envie de."),
    ],
  },

  // ───────── Autres classiques ─────────
  {
    id: "rBrd_3VMC3c", titre: "What a Wonderful World", artiste: "Louis Armstrong", annee: 1967, decennie: "60s", style: "Jazz / Standard", duree: "2:19", chaine: "Louis Armstrong",
    histoire: "Louis Armstrong a enregistré cette chanson en 1967. Elle a été écrite par Bob Thiele et George David Weiss. Armstrong est l'un des plus grands trompettistes de jazz et sa voix rauque est reconnaissable entre mille.",
    sujet: "Un message simple et rassurant : le monde est beau si on prend le temps de regarder la nature, les gens et les petits bonheurs du quotidien.",
    mots: [
      m("wonderful", "merveilleux", "wonder + -ful. « Wonder » = émerveillement, aussi le verbe « se demander ».", "A2"),
      m("what a …!", "quel …!", "Exclamation : « What a day ! » = Quelle journée !", "A2"),
      m("world", "monde", "Se prononce « weurld ». Pas de lien avec « word » (mot).", "A2"),
      m("to bloom", "fleurir", "Verbe pour les fleurs. Un « bloom » est une fleur.", "B2"),
      m("rainbow", "arc-en-ciel", "rain + bow. Un mot composé facile à retenir.", "A2"),
      m("to shake hands", "se serrer la main", "On dit « shake hands with someone ».", "B1"),
      m("to grow", "grandir / pousser", "Verbe irrégulier : grow, grew, grown.", "A2"),
    ],
    quiz: [
      q("« What a wonderful day ! » signifie…", ["Quel jour merveilleux !", "Quelle heure est-il ?", "Quel jour sommes-nous ?", "Il fait chaud"], 0, "« What a … ! » est une exclamation."),
      q("« Rainbow » se traduit par…", ["un orage", "un arc-en-ciel", "une pluie fine", "un nuage"], 1, "Rain (pluie) + bow (arc) = arc-en-ciel."),
      q("Quel est le passé de « to grow » ?", ["growed", "grew", "grown", "grawed"], 1, "Grow, grew, grown."),
    ],
  },
  {
    id: "rTVjnBo96Ug", titre: "(Sittin' On) The Dock of the Bay", artiste: "Otis Redding", annee: 1968, decennie: "60s", style: "Soul", duree: "2:43", chaine: "RHINO et Stax Records",
    histoire: "Otis Redding a enregistré ce titre en décembre 1967, quelques jours avant de mourir dans un accident d'avion. Il est sorti en 1968 et il est devenu le premier numéro un américain posthume. Steve Cropper a co-écrit la chanson.",
    sujet: "Un homme s'assied au bord de l'eau et regarde passer les jours. Il se sent loin de chez lui, un peu perdu, mais il apprécie ce moment calme.",
    mots: [
      m("dock", "quai / ponton", "Endroit où les bateaux s'amarrent.", "B1"),
      m("bay", "baie", "Partie de mer entourée de terre.", "B1"),
      m("sittin'", "assis (sitting)", "À l'oral, on remplace souvent « -ing » par « -in' ».", "A2"),
      m("tide", "marée", "Mouvement de la mer. « High tide » = marée haute.", "B2"),
      m("to roll away", "s'éloigner en roulant", "Verbe à particule pour parler d'un mouvement lent.", "B2"),
      m("far from home", "loin de chez soi", "« Far from » = loin de.", "A2"),
      m("to watch", "regarder (longtemps)", "On « watch » ce qui bouge (un match, un bateau). « Look at » = jeter un œil.", "A2"),
    ],
    quiz: [
      q("« Dock » désigne…", ["une horloge", "un quai", "un docteur", "un phare"], 1, "Dock = quai, ponton."),
      q("« Sittin' » est une forme orale de…", ["sit", "sitting", "sat", "sits"], 1, "En chanson et à l'oral, « -ing » devient « -in' »."),
      q("« Far from home » veut dire…", ["près de chez soi", "loin de chez soi", "à la maison", "sans maison"], 1, "Far from = loin de."),
    ],
  },
  {
    id: "dtC1W-6hwIU", titre: "Lean on Me", artiste: "Bill Withers", annee: 1972, decennie: "70s", style: "Soul / Folk", duree: "4:17", chaine: "Bill Withers",
    histoire: "Bill Withers a sorti « Lean on Me » en 1972 sur l'album Still Bill, et le titre a été numéro un aux États-Unis. Le clip ci-dessous est une version en concert de la BBC (1974) publiée sur sa chaîne officielle.",
    sujet: "La chanson parle d'entraide : quand on va mal, on peut compter sur un ami, et un jour ce sera à nous de soutenir l'autre.",
    mots: [
      m("to lean on", "s'appuyer sur", "Au sens propre et au sens figuré : compter sur quelqu'un.", "B1"),
      m("friend", "ami", "Attention à l'orthographe : f-r-i-e-n-d.", "A2"),
      m("to need", "avoir besoin de", "« I need help » = j'ai besoin d'aide.", "A2"),
      m("to carry", "porter", "Porter un poids, aussi au sens figuré.", "B1"),
      m("strong", "fort", "Adjectif. Contraire : « weak » (faible).", "A2"),
      m("to count on", "compter sur", "Synonyme de « to rely on ».", "B1"),
      m("a burden", "un fardeau", "Quelque chose de lourd à porter, concret ou moral.", "B2"),
    ],
    quiz: [
      q("« To lean on someone » veut dire…", ["se moquer de quelqu'un", "compter sur quelqu'un", "s'éloigner de quelqu'un", "écouter quelqu'un"], 1, "To lean on = s'appuyer sur, compter sur."),
      q("Quel est le contraire de « strong » ?", ["high", "weak", "sad", "soft"], 1, "Strong (fort) ≠ weak (faible)."),
      q("« A burden » est…", ["un cadeau", "une aide", "un fardeau", "un repas"], 2, "Burden = fardeau, charge lourde."),
    ],
  },
  {
    id: "HNBCVM4KbUM", titre: "Three Little Birds", artiste: "Bob Marley & The Wailers", annee: 1977, decennie: "70s", style: "Reggae", duree: "3:13", chaine: "Bob Marley",
    histoire: "Bob Marley & The Wailers ont sorti « Three Little Birds » en 1977 sur l'album Exodus. Le groupe vient de Jamaïque et le reggae a fait connaître le pays dans le monde entier.",
    sujet: "Un message très positif : il ne faut pas s'inquiéter, car tout va finir par s'arranger. La chanson invite à rester calme et confiant.",
    mots: [
      m("bird", "oiseau", "Le « ir » se prononce « eur ». Trois = « three » (« th » comme dans « think »).", "A2"),
      m("little", "petit", "Synonyme de « small », avec une idée de tendresse.", "A2"),
      m("to worry", "s'inquiéter", "« Don't worry » = ne t'inquiète pas.", "A2"),
      m("every little thing", "tout (jusqu'au moindre détail)", "Expression de réconfort : rien n'est trop petit pour être arrangé.", "B1"),
      m("to be alright", "aller bien / être OK", "Variante : « all right ».", "A2"),
      m("sunrise", "lever du soleil", "sun + rise : le soleil se lève. Contraire : « sunset ».", "B1"),
      m("a sign", "un signe", "Quelque chose qui annonce autre chose.", "B1"),
    ],
    quiz: [
      q("« Don't worry » signifie…", ["Ne pars pas", "Ne t'inquiète pas", "Ne travaille pas", "Ne parle pas"], 1, "Worry = s'inquiéter."),
      q("Quel mot est le contraire de « sunrise » ?", ["sunset", "sunday", "sunny", "sunburn"], 0, "Sunrise = lever du soleil ; sunset = coucher du soleil."),
      q("« Little » est proche de…", ["large", "small", "heavy", "lazy"], 1, "Little ≈ small = petit."),
    ],
  },
  {
    id: "6hzrDeceEKc", titre: "Wonderwall", artiste: "Oasis", annee: 1995, decennie: "90s", style: "Rock / Britpop", duree: "4:40", chaine: "Oasis",
    histoire: "Oasis est un groupe de Manchester. « Wonderwall » est sortie en 1995, sur l'album (What's the Story) Morning Glory?, et elle a été écrite par Noel Gallagher. C'est l'un des plus grands succès du Britpop.",
    sujet: "Le narrateur parle d'une personne importante qui l'aide à surmonter ses difficultés. Le mot du titre désigne quelqu'un qui compte beaucoup pour lui.",
    mots: [
      m("wonderwall", "mot inventé", "Mélange de « wonder » (émerveillement) et « wall » (mur). Dans la chanson, quelqu'un de précieux.", "B2"),
      m("wall", "mur", "Un mur de maison. Un « wallet » est un portefeuille, pas un mur !", "A2"),
      m("to save", "sauver / économiser", "Deux sens : sauver quelqu'un ou mettre de l'argent de côté.", "B1"),
      m("maybe", "peut-être", "Synonyme de « perhaps ».", "A2"),
      m("to realize", "se rendre compte", "Faux ami : « to realize » ne veut pas dire « réaliser » au sens de faire.", "B1"),
      m("somebody", "quelqu'un", "Synonyme : « someone ».", "A2"),
      m("anymore", "plus (ne … plus)", "À la forme négative : « I don't know anymore ».", "B1"),
    ],
    quiz: [
      q("Que veut dire « maybe » ?", ["peut-être", "bien sûr", "jamais", "souvent"], 0, "Maybe = peut-être."),
      q("« To realize » signifie…", ["réaliser (faire)", "se rendre compte", "réparer", "rêver"], 1, "Faux ami : realize = comprendre, se rendre compte. « Réaliser » se dit « to make » ou « to achieve »."),
      q("« To save » peut vouloir dire…", ["sauver ou économiser", "seulement sauter", "chanter", "oublier"], 0, "To save = sauver / économiser / enregistrer (un fichier)."),
    ],
  },
  {
    id: "Urdlvw0SSEc", titre: "Fallin'", artiste: "Alicia Keys", annee: 2001, decennie: "2000s", style: "R&B / Soul", duree: "3:27", chaine: "Alicia Keys",
    histoire: "« Fallin' » est le premier single d'Alicia Keys, sorti en 2001 sur l'album Songs in A Minor. Elle a reçu plusieurs Grammy Awards en 2002 grâce à ce titre et à cet album. Alicia Keys est américaine, de New York.",
    sujet: "La chanson parle d'une relation compliquée où l'on aime quelqu'un, puis on doute, puis on s'éloigne, puis on revient. Le titre joue sur l'idée de tomber amoureux, et de tomber tout court.",
    mots: [
      m("to fall", "tomber", "Verbe irrégulier : fall, fell, fallen.", "A2"),
      m("to fall in love", "tomber amoureux", "On dit « fall in love with someone ».", "A2"),
      m("fallin'", "falling", "À l'oral, « -ing » devient « -in' ».", "A2"),
      m("ups and downs", "hauts et bas", "Expression idiomatique : moments heureux et moments difficiles.", "B2"),
      m("to keep on", "continuer à", "« Keep on + -ing » = ne pas arrêter.", "B1"),
      m("to doubt", "douter", "Le « b » est muet : « daout ».", "B2"),
      m("to be torn", "être partagé", "Hésiter entre deux choix. Torn est le participe de « tear ».", "B2"),
    ],
    quiz: [
      q("Quel est le passé de « to fall » ?", ["falled", "fell", "fallen", "fall"], 1, "Fall, fell, fallen."),
      q("« To fall in love with someone » veut dire…", ["être déçu par quelqu'un", "tomber amoureux de quelqu'un", "quitter quelqu'un", "écrire à quelqu'un"], 1, "On tombe amoureux « with » quelqu'un."),
      q("« Ups and downs » signifie…", ["escaliers", "hauts et bas", "ascenseurs", "chutes"], 1, "Expression : moments heureux et difficiles."),
    ],
  },
  {
    id: "KUmZp8pR1uc", titre: "Rehab", artiste: "Amy Winehouse", annee: 2006, decennie: "2000s", style: "Soul / R&B rétro", duree: "3:34", chaine: "Amy Winehouse",
    histoire: "Amy Winehouse était une chanteuse britannique. « Rehab » est sortie en 2006 sur l'album Back to Black et a remporté plusieurs Grammy Awards en 2008. Le son rappelle la soul des années 60.",
    sujet: "La narratrice refuse qu'on la force à se soigner. Elle dit qu'elle préfère décider seule, même si les autres s'inquiètent pour elle.",
    mots: [
      m("rehab", "cure de désintoxication", "Abréviation de « rehabilitation ». Mot courant à l'oral.", "B2"),
      m("to refuse", "refuser", "Plus fort que « to say no ». Nom : « refusal ».", "B1"),
      m("to try", "essayer", "« Try to + verbe » = essayer de.", "A2"),
      m("a decision", "une décision", "On dit « make a decision » (faire un choix), pas « take ».", "B1"),
      m("stubborn", "têtu", "Qui ne change pas d'avis. Synonyme : « obstinate ».", "B2"),
      m("to go back", "retourner", "Le mot « back » est dans l'album : Back to Black.", "A2"),
      m("to be worried about", "s'inquiéter pour", "Plus courant que « to worry ». Ex. : « I'm worried about you ».", "B1"),
    ],
    quiz: [
      q("Que veut dire « stubborn » ?", ["têtu", "triste", "gentil", "timide"], 0, "Stubborn = têtu, qui refuse de changer d'avis."),
      q("« Rehab » est l'abréviation de…", ["rehearsal", "rehabilitation", "refuse", "rehash"], 1, "Rehab = rehabilitation (centre de soins)."),
      q("Quel verbe va avec « decision » ?", ["do", "make", "put", "give"], 1, "On dit « make a decision »."),
    ],
  },
  {
    id: "hLQl3WQQoQ0", titre: "Someone Like You", artiste: "Adele", annee: 2011, decennie: "2010s", style: "Pop / Soul ballad", duree: "4:45", chaine: "Adele",
    histoire: "Adele est une chanteuse britannique. « Someone Like You » est sortie en 2011 sur l'album 21, et elle l'a écrite avec Dan Wilson. La chanson est restée au sommet des classements britanniques.",
    sujet: "La narratrice apprend qu'une personne qu'elle a aimée est passée à autre chose. Elle est triste, mais elle lui souhaite du bonheur et espère trouver un amour pareil un jour.",
    mots: [
      m("someone like you", "quelqu'un comme toi", "« Like » est ici une préposition (comme), pas un verbe.", "A2"),
      m("to wish", "souhaiter", "« I wish you the best » = je te souhaite le meilleur.", "B1"),
      m("to move on", "passer à autre chose", "Continuer sa vie après une rupture.", "B2"),
      m("to find", "trouver", "Verbe irrégulier : find, found, found.", "A2"),
      m("to remember", "se souvenir", "Pas de « se » en anglais : « I remember you ».", "A2"),
      m("never mind", "ce n'est pas grave", "Expression utile : laisser tomber, oublier.", "B1"),
      m("heartbreak", "chagrin d'amour", "heart + break : le cœur qui se brise.", "B2"),
    ],
    quiz: [
      q("« Heartbreak » veut dire…", ["une crise cardiaque", "un chagrin d'amour", "un battement de cœur", "un cadeau"], 1, "Heart (cœur) + break (briser) = chagrin d'amour."),
      q("Quel est le passé de « to find » ?", ["finded", "found", "fund", "fount"], 1, "Find, found, found."),
      q("« Never mind » signifie…", ["jamais d'esprit", "ce n'est pas grave", "ne pense pas", "toujours"], 1, "Never mind = laisse tomber, ce n'est pas grave."),
    ],
  },
  {
    id: "ZbZSe6N_BXs", titre: "Happy", artiste: "Pharrell Williams", annee: 2013, decennie: "2010s", style: "Pop / Soul-funk", duree: "4:01", chaine: "Pharrell Williams",
    histoire: "« Happy » est sortie fin 2013. Elle a été écrite et chantée par Pharrell Williams pour la bande originale du film d'animation Moi, moche et méchant 2. Elle a été nommée à l'Oscar de la meilleure chanson originale.",
    sujet: "Un vrai concentré de bonne humeur : peu importe ce qui se passe autour de soi, on peut choisir d'être heureux et de danser.",
    mots: [
      m("happy", "heureux", "Contraire : « sad ». Nom : « happiness ».", "A2"),
      m("clap along", "taper dans les mains", "« Clap » = applaudir ; « along » = en même temps que la musique.", "B1"),
      m("room", "pièce / espace", "Aussi : « no room for » = pas de place pour.", "A2"),
      m("to bring someone down", "déprimer quelqu'un", "Verbe à particule. Contraire : « to cheer up ».", "B2"),
      m("to cheer up", "remonter le moral", "S'emploie à l'impératif : « Cheer up ! ».", "B1"),
      m("good mood", "bonne humeur", "« Be in a good mood » = être de bonne humeur.", "A2"),
      m("sunshine", "soleil / lumière du soleil", "sun + shine.", "A2"),
    ],
    quiz: [
      q("Quel est le contraire de « happy » ?", ["sad", "tall", "angry", "late"], 0, "Happy (heureux) est l'opposé de sad (triste)."),
      q("« To cheer someone up » veut dire…", ["lui faire peur", "lui remonter le moral", "lui répondre", "l'inviter"], 1, "To cheer up = remonter le moral."),
      q("« Good mood » se traduit par…", ["bon repas", "bonne humeur", "bonne lune", "bon moment"], 1, "Mood = humeur."),
    ],
  },
  {
    id: "H5v3kku4y6Q", titre: "As It Was", artiste: "Harry Styles", annee: 2022, decennie: "2020s", style: "Pop / Synth-pop", duree: "2:46", chaine: "Harry Styles",
    histoire: "Harry Styles est un chanteur britannique, ancien membre des One Direction. « As It Was » est sortie en avril 2022 sur l'album Harry's House. Le clip, très dansé, est devenu l'un des plus vus de l'année.",
    sujet: "Le titre parle du changement : les choses ne sont plus comme avant, et le narrateur se sent un peu seul au milieu de ce monde qui évolue.",
    mots: [
      m("as it was", "comme c'était", "« As » + sujet + verbe : « comme ». Ici, le passé de « to be ».", "B1"),
      m("to change", "changer", "Verbe régulier ; nom : « a change ».", "A2"),
      m("the past", "le passé", "Contraires : « the present », « the future ».", "A2"),
      m("lonely", "seul(e) et triste", "À distinguer de « alone ».", "B1"),
      m("to miss", "manquer à / regretter", "« I miss you » = tu me manques (sens inversé du français !).", "B1"),
      m("to spin", "tourner (vite)", "Verbe irrégulier : spin, spun, spun.", "B2"),
      m("to leave", "partir / quitter", "Verbe irrégulier : leave, left, left.", "A2"),
    ],
    quiz: [
      q("« I miss you » veut dire…", ["Je te rate", "Tu me manques", "Je te vois", "Je t'oublie"], 1, "Attention au sens inversé : « I miss you » = tu me manques."),
      q("Le passé de « to leave » est…", ["leaved", "left", "leaft", "lift"], 1, "Leave, left, left."),
      q("« The past » signifie…", ["le futur", "le présent", "le passé", "le passage"], 2, "The past = le passé."),
    ],
  },
  {
    id: "TUVcZfQe-Kw", titre: "Levitating", artiste: "Dua Lipa", annee: 2020, decennie: "2020s", style: "Pop / Disco", duree: "3:51", chaine: "Dua Lipa",
    histoire: "Dua Lipa est une chanteuse britannique. « Levitating » est sortie en 2020 sur l'album Future Nostalgia. Le clip proposé ici est la version avec DaBaby et mélange pop moderne et ambiance disco.",
    sujet: "La chanson parle de la sensation de flotter de bonheur quand on est amoureux. On y retrouve des images de l'espace et d'une soirée de danse.",
    mots: [
      m("to levitate", "léviter / flotter", "Rester en l'air sans support. Image pour dire « je suis aux anges ».", "B2"),
      m("moonlight", "clair de lune", "moon + light.", "B1"),
      m("galaxy", "galaxie", "Ressemble au français.", "B1"),
      m("to dance all night", "danser toute la nuit", "« All night » = toute la nuit.", "A2"),
      m("to get up", "se lever", "Verbe à particule : se mettre debout.", "A2"),
      m("to feel", "ressentir / se sentir", "Verbe irrégulier : feel, felt, felt.", "A2"),
      m("fun", "amusant / amusement", "« Have fun ! » = amuse-toi bien. Ne pas confondre avec « funny » (drôle).", "A2"),
    ],
    quiz: [
      q("« To levitate » veut dire…", ["éteindre", "léviter", "lever la main", "tomber"], 1, "To levitate = léviter, flotter dans l'air."),
      q("« Have fun ! » signifie…", ["Fais attention", "Amuse-toi bien", "Fais vite", "Bois un verre"], 1, "Have fun = amuse-toi bien."),
      q("Le passé de « to feel » est…", ["feeled", "felt", "fell", "fult"], 1, "Feel, felt, felt."),
    ],
  },
]

// ───────── Albums complets ─────────
// Les albums sont lus via les playlists d'album OFFICIELLES de YouTube (identifiant « OLAK5uy_… »,
// générées par YouTube pour les labels). On peut passer d'un titre à l'autre dans le lecteur.
export type Titre = { t: string; note?: string }
export type Album = {
  id: string            // identifiant de la playlist d'album officielle (OLAK5uy_…), aussi clé des favoris / « appris »
  titre: string
  artiste: string
  annee: number
  label: string
  nbTitres: number      // nombre de vidéos de la playlist officielle
  vignette: string      // identifiant d'une vidéo de la playlist (miniature = pochette)
  edition?: string      // précision sur l'édition lue
  explicite?: boolean   // paroles explicites
  couleur: string       // couleur de secours si la miniature ne charge pas
  histoire: string
  pourquoi: string
  titres: Titre[]
  titresNote?: string
  mots: Mot[]
  quiz: Question[]
}

export const ALBUMS: Album[] = [
  {
    id: "OLAK5uy_mEJ8cCMOkj4hse7QHbRajvO04lNc1Zxmc", titre: "Thriller", artiste: "Michael Jackson", annee: 1982, label: "Epic Records", nbTitres: 34, vignette: "RBrIKRjcxcg", couleur: "#7A1F2B",
    edition: "Édition « Thriller 40 » (2022) : les 9 titres de l'album original, suivis de titres bonus.",
    histoire: "Thriller est le sixième album de Michael Jackson. Il est sorti à la fin de 1982 chez Epic Records et a été produit par Quincy Jones, avec qui il avait déjà travaillé sur Off the Wall. L'album mélange pop, rock, funk et soul. Sept de ses neuf titres sont devenus des succès dans les classements américains. Cette lecture est l'édition anniversaire « Thriller 40 » : l'album original est au début, les bonus viennent ensuite.",
    pourquoi: "Thriller est souvent cité comme l'album le plus vendu de tous les temps et il a reçu huit Grammy Awards en 1984. Il a aussi changé la place du clip vidéo dans la musique. Pour apprendre l'anglais, ses chansons sont claires, bien chantées et pleines d'expressions du quotidien.",
    titres: [
      { t: "Wanna Be Startin' Somethin'", note: "Ouverture funky de l'album, très rythmée, sur les rumeurs et les bavardages." },
      { t: "Baby Be Mine" },
      { t: "The Girl Is Mine", note: "Un duo avec Paul McCartney, avec un style plus doux et plus pop." },
      { t: "Thriller", note: "Chanson-titre sur le thème des films d'horreur ; son clip de près de 14 minutes est devenu célèbre." },
      { t: "Beat It", note: "Pop-rock avec un solo de guitare ; le titre raconte qu'il vaut mieux éviter une bagarre." },
      { t: "Billie Jean", note: "Une histoire d'une femme qui prétend à tort que le narrateur est le père de son enfant." },
      { t: "Human Nature" },
      { t: "P.Y.T. (Pretty Young Thing)" },
      { t: "The Lady in My Life" },
    ],
    titresNote: "Ce sont les 9 titres de l'album original. Après eux, l'édition Thriller 40 ajoute des titres bonus (démos, versions alternatives, etc.).",
    mots: [
      m("thriller", "film ou roman à suspense", "Une histoire qui fait peur ou qui tient en haleine. Ne pas confondre avec « chiller ».", "A2"),
      m("best-selling", "le plus vendu", "« A best-selling album » = un album qui se vend énormément.", "B1"),
      m("to release", "sortir (un disque), publier", "« The album was released in 1982 » = l'album est sorti en 1982.", "B1"),
      m("a hit", "un tube, un succès", "« A hit single » = un single à succès.", "A2"),
      m("to top the charts", "être numéro un des classements", "« The charts » = les classements musicaux.", "B1"),
      m("Beat it!", "Dégage !", "Expression familière pour dire à quelqu'un de partir tout de suite.", "B1"),
      m("a producer", "un producteur / une productrice", "La personne qui dirige la création du disque en studio.", "A2"),
      m("record-breaking", "qui bat des records", "On le met devant un nom : « a record-breaking year ».", "B2"),
      m("album of the year", "album de l'année", "Une des plus grandes récompenses des Grammy Awards.", "B1"),
      m("legacy", "héritage", "Ce qu'un artiste laisse derrière lui. Attention : ce n'est pas « legal ».", "B2"),
    ],
    quiz: [
      q("Qui a produit l'album Thriller ?", ["Quincy Jones", "Paul McCartney", "Prince", "Elton John"], 0, "Quincy Jones a produit Thriller, comme l'album précédent Off the Wall."),
      q("Que veut dire « best-selling » ?", ["le mieux chanté", "le plus vendu", "le plus long", "le plus récent"], 1, "Best-selling = qui se vend le plus : un best-seller."),
      q("Quel mot anglais veut dire « sortir (un disque) » ?", ["to release", "to relax", "to remove", "to remember"], 0, "To release = sortir, publier. « The album was released » = l'album est sorti."),
      q("« Beat it ! » est une expression familière qui veut dire…", ["Bats-toi !", "Dégage !", "Fais-le encore !", "Chante plus fort !"], 1, "« Beat it ! » = va-t'en, dégage. Ce n'est pas du tout « battre » ici."),
    ],
  },
  {
    id: "OLAK5uy_lNgFWb1NBUl4UHgbs2Yii6ZSoWDCxBBdY", titre: "Ladies & Gentlemen: The Best of George Michael", artiste: "George Michael", annee: 1998, label: "Epic Records", nbTitres: 29, vignette: "SXDofh8KecE", couleur: "#1E3A5F",
    edition: "La playlist officielle compte 29 titres (la compilation double de 1998, avec éventuellement des titres en plus selon l'édition).",
    histoire: "George Michael est un chanteur britannique, né à Londres. Il a commencé dans le duo Wham! avec Andrew Ridgeley, puis il a eu une grande carrière en solo, notamment avec l'album Faith (1987). Ladies & Gentlemen: The Best of George Michael est une compilation sortie en 1998. C'est un double album : un disque de chansons plutôt calmes (« For the Heart ») et un autre de titres plus dansants (« For the Feet »).",
    pourquoi: "C'est le meilleur moyen de découvrir toute sa carrière en un seul album, des ballades aux titres de danse. Sa voix claire et ses textes simples sont idéaux pour travailler l'anglais, surtout les thèmes de l'amour, de la liberté et de la confiance en soi.",
    titres: [
      { t: "Careless Whisper", note: "Une ballade célèbre, avec un saxophone très reconnaissable, sur un amour trahi et le regret." },
      { t: "Father Figure", note: "Une chanson lente et douce sur la protection et la confiance dans une relation." },
      { t: "Faith", note: "Titre phare de l'album du même nom, au son rock'n'roll des années 50." },
      { t: "Freedom! '90", note: "Une chanson où il parle de sa liberté d'artiste et de sa façon de se voir." },
      { t: "Jesus to a Child", note: "Un morceau calme et sincère, écrit après une perte très douloureuse." },
      { t: "Fastlove", note: "Un titre dansant des années 90 sur l'envie d'amour rapide." },
      { t: "Kissing a Fool" }, { t: "One More Try" }, { t: "Praying for Time" }, { t: "Outside" }, { t: "I Want Your Sex" },
      { t: "Somebody to Love", note: "Reprise de Queen, chantée en live avec le groupe." },
      { t: "Don't Let the Sun Go Down on Me", note: "Un duo avec Elton John." },
      { t: "As" },
    ],
    titresNote: "Sélection de titres de la compilation (la playlist officielle en contient 29).",
    mots: [
      m("careless", "négligent, imprudent", "Se forme avec « care » + « -less » (sans). Le contraire : « careful » (prudent).", "B1"),
      m("to whisper", "chuchoter", "Parler tout bas. Le nom : « a whisper ».", "B1"),
      m("faith", "foi, confiance", "Peut être religieuse ou simplement la confiance en quelqu'un.", "B1"),
      m("freedom", "liberté", "Nom formé sur « free ». Un mot clé en musique et en histoire.", "A2"),
      m("a fool", "un idiot, un fou", "« To kiss a fool » reste un titre imagé ; « fool » est un peu fort en conversation.", "B1"),
      m("to pray", "prier", "Au sens large : espérer très fort que quelque chose arrive.", "B1"),
      m("a ballad", "une ballade, un morceau lent et romantique", "Le contraire d'un titre de danse.", "B1"),
      m("a duet", "un duo", "Une chanson interprétée à deux voix.", "B1"),
      m("the best of …", "le meilleur de …, une compilation", "« A best of » = un album avec les plus grands succès.", "A2"),
      m("a dance floor", "une piste de danse", "Le sol où l'on danse dans un club.", "A2"),
    ],
    quiz: [
      q("Avec quel groupe George Michael a-t-il commencé ?", ["Queen", "Wham!", "The Beatles", "Duran Duran"], 1, "George Michael a débuté dans le duo Wham! avec Andrew Ridgeley."),
      q("« A ballad » est…", ["un morceau lent et romantique", "une danse rapide", "un instrument", "un concert gratuit"], 0, "Une ballade est généralement lente et émouvante."),
      q("« To whisper » veut dire…", ["crier", "chuchoter", "siffler", "chanter faux"], 1, "To whisper = chuchoter, parler tout bas."),
      q("« A duet » est une chanson chantée…", ["en groupe", "à deux voix", "sans musique", "en langue étrangère"], 1, "Duet vient de « duo » : deux personnes chantent ensemble."),
    ],
  },
  {
    id: "OLAK5uy_mvz7Tr6ZqTX0GKxE4lP5ifCaE9Sx-AEjc", titre: "The College Dropout", artiste: "Kanye West", annee: 2004, label: "Roc-A-Fella / Def Jam", nbTitres: 21, vignette: "OTZzjAU0Kg0", explicite: true, couleur: "#6B4423",
    histoire: "The College Dropout est le premier album de Kanye West, sorti en février 2004. Avant d'être rappeur, Kanye était surtout un producteur très demandé. Son titre « Through the Wire » a été enregistré après un grave accident de voiture, alors qu'il avait la mâchoire immobilisée. L'album parle d'école, de famille, de foi et de la pression d'avoir une réussite sociale. Il contient aussi des petits sketchs (« skits ») entre les chansons.",
    pourquoi: "L'album a été très bien accueilli par la critique et a fait connaître Kanye au grand public. Il a montré qu'un rap personnel, drôle et honnête pouvait plaire à beaucoup de monde. Son anglais est riche en expressions familières, parfait pour apprendre des mots du quotidien. Paroles explicites : il y a des mots crus et des thèmes adultes.",
    titres: [
      { t: "Intro" }, { t: "We Don't Care" }, { t: "Graduation Day" },
      { t: "All Falls Down", note: "Un titre sur l'insécurité et la pression de l'argent et de l'image." },
      { t: "I'll Fly Away" }, { t: "Spaceship" },
      { t: "Jesus Walks", note: "Un des titres les plus célèbres, sur la foi, avec une rythmique de fanfare." },
      { t: "Never Let Me Down" }, { t: "Get 'Em High" }, { t: "Workout Plan" }, { t: "The New Workout Plan" },
      { t: "Slow Jamz" }, { t: "Breathe In Breathe Out" }, { t: "School Spirit" }, { t: "Two Words" },
      { t: "Through the Wire", note: "Le premier gros succès, enregistré après son accident de voiture." },
      { t: "Family Business", note: "Un morceau calme sur la famille et les souvenirs." },
      { t: "Last Call", note: "Un long final où il raconte son parcours." },
    ],
    titresNote: "Titres principaux. L'album comprend aussi 3 courts sketchs (skits) entre les morceaux : 21 pistes en tout.",
    mots: [
      m("dropout", "personne qui abandonne ses études", "Vient de « to drop out » = abandonner (l'école, un cours).", "B1"),
      m("to graduate", "obtenir son diplôme", "Aux États-Unis, « graduation » est la cérémonie de remise des diplômes.", "B1"),
      m("college", "université (aux États-Unis)", "Faux ami : au Royaume-Uni, « college » peut être un lycée ou une école supérieure ; en France, un collège se dit « middle school ».", "A2"),
      m("school spirit", "esprit d'école, fierté de son établissement", "Les élèves qui encouragent leur école, surtout dans le sport.", "B1"),
      m("tuition", "frais de scolarité", "L'argent qu'on paie pour étudier à l'université.", "B2"),
      m("a debut album", "un premier album", "« Debut » vient du français « début » mais se prononce [DAY-byoo].", "B1"),
      m("to sample", "échantillonner (musique)", "Réutiliser un petit extrait d'un autre enregistrement dans un morceau.", "B2"),
      m("a skit", "un petit sketch", "Une courte scène parlée ou drôle, entre deux chansons.", "B2"),
      m("faith", "foi, confiance", "Parfois religieuse, parfois la confiance dans l'avenir.", "B1"),
      m("success story", "histoire de réussite", "Parcours d'une personne qui réussit malgré les difficultés.", "B2"),
    ],
    quiz: [
      q("Que veut dire « college dropout » ?", ["étudiant brillant", "personne qui abandonne ses études", "professeur d'université", "ancien président"], 1, "To drop out = abandonner ; a dropout = quelqu'un qui a arrêté ses études."),
      q("« To graduate » signifie…", ["partir en vacances", "obtenir son diplôme", "redoubler", "commencer l'école"], 1, "To graduate = être diplômé."),
      q("Quel est le premier album de Kanye West ?", ["The College Dropout", "Graduation", "Yeezus", "Late Registration"], 0, "The College Dropout (2004) est son premier album."),
      q("« To sample » en musique veut dire…", ["goûter", "échantillonner un extrait", "effacer un son", "chanter en direct"], 1, "To sample = réutiliser un petit morceau d'un autre enregistrement."),
    ],
  },
  {
    id: "OLAK5uy_kDxtYFIll1LmZFnZGrhQLAyQ2T1SYgGtU", titre: "Late Registration", artiste: "Kanye West", annee: 2005, label: "Roc-A-Fella / Def Jam", nbTitres: 21, vignette: "Bwyu-SZ7g_E", explicite: true, couleur: "#3B3A6B",
    histoire: "Late Registration est le deuxième album de Kanye West, sorti en 2005. Il l'a réalisé avec le musicien et producteur Jon Brion, ce qui explique les cordes et les instruments classiques qu'on entend. Le titre joue avec l'idée d'une inscription en retard à l'université, comme dans le premier album. « Diamonds from Sierra Leone » parle des diamants de la guerre, et « Gold Digger » est devenu un énorme succès.",
    pourquoi: "L'album a été salué par la critique et a gagné un Grammy du meilleur album de rap. Il montre comment un rappeur peut inventer un son plus riche, avec orchestre et soul. C'est aussi un bon album pour les expressions de la vie quotidienne. Paroles explicites : il y a des mots crus et des thèmes adultes.",
    titres: [
      { t: "Wake Up Mr. West" }, { t: "Heard 'Em Say" }, { t: "Touch the Sky", note: "Un titre plein d'énergie, avec des cuivres, sur le goût du défi." },
      { t: "Gold Digger", note: "Un grand succès : une chanson sur les gens intéressés par l'argent des autres." },
      { t: "Drive Slow" }, { t: "My Way Home" }, { t: "Crack Music" }, { t: "Roses", note: "Un morceau émouvant sur la maladie d'un proche à l'hôpital." },
      { t: "Bring Me Down" }, { t: "Addiction" },
      { t: "Diamonds from Sierra Leone", note: "Sur les « diamants du sang » et ce qu'ils coûtent à certains pays." },
      { t: "We Major" }, { t: "Hey Mama", note: "Une chanson d'amour envers sa mère." },
      { t: "Celebration" }, { t: "Gone" }, { t: "Late" },
    ],
    titresNote: "Titres principaux. L'album comprend aussi des interludes (skits) et une version remix de « Diamonds from Sierra Leone » : 21 pistes en tout.",
    mots: [
      m("registration", "inscription", "À l'école ou pour un cours. « Late registration » = inscription tardive.", "B1"),
      m("late", "en retard / tardif", "À ne pas confondre avec « latest » (le plus récent).", "A2"),
      m("a gold digger", "personne intéressée par l'argent", "Expression familière : quelqu'un qui est en couple pour l'argent.", "B2"),
      m("to touch the sky", "toucher le ciel", "Image pour dire viser très haut.", "B1"),
      m("diamond", "diamant", "Ressemble au français mais se prononce [DAÏ-mond].", "A2"),
      m("blood diamond", "diamant du sang", "Diamant vendu pour financer une guerre.", "B2"),
      m("a sophomore album", "un deuxième album", "En américain, « sophomore » = en deuxième année ; ici, deuxième disque.", "B2"),
      m("strings", "les cordes (violons, etc.)", "Les instruments à cordes d'un orchestre.", "B2"),
      m("critical acclaim", "éloges de la critique", "Les journalistes spécialisés ont adoré l'album.", "B2"),
      m("to celebrate", "fêter, célébrer", "Le nom : « a celebration ».", "A2"),
    ],
    quiz: [
      q("Que veut dire « registration » ?", ["inscription", "récréation", "régime", "rédaction"], 0, "Registration = inscription (à l'école, à un événement)."),
      q("« A gold digger » désigne…", ["un mineur d'or", "quelqu'un d'intéressé par l'argent", "un bijoutier", "un chercheur de trésors"], 1, "Au sens familier : quelqu'un qui cherche surtout l'argent d'autrui."),
      q("« Late Registration » est le…", ["premier album de Kanye", "deuxième album de Kanye", "dernier album de Kanye", "premier album de Michael Jackson"], 1, "Late Registration (2005) est le deuxième album de Kanye West."),
      q("Quel mot veut dire « diamant » ?", ["diamond", "dimension", "dinner", "disk"], 0, "Diamond = diamant."),
    ],
  },
  {
    id: "OLAK5uy_mvufvU5j2nouW_FVV7Z5feltvHCjUen84", titre: "808s & Heartbreak", artiste: "Kanye West", annee: 2008, label: "Roc-A-Fella / Def Jam", nbTitres: 12, vignette: "D58eeRRLqws", explicite: true, couleur: "#1F3F4A",
    histoire: "808s & Heartbreak est le quatrième album de Kanye West, sorti en 2008. Le « 808 » est le nom d'une boîte à rythmes de marque Roland très utilisée en hip-hop. Kanye y chante beaucoup, souvent avec Auto-Tune, au lieu de seulement rapper. L'album a été réalisé après une période très difficile de sa vie : on y entend des thèmes de solitude, de rupture et de tristesse, sur des sons sobres et froids.",
    pourquoi: "À sa sortie, l'album a surpris, puis il est devenu une grande référence : beaucoup d'artistes de pop et de hip-hop se sont inspirés de ce style plus émotionnel. Pour apprendre l'anglais, ses phrases courtes et ses mots de sentiments sont faciles à retenir. Paroles explicites : il y a des mots crus et des thèmes adultes.",
    titres: [
      { t: "Say You Will" }, { t: "Welcome to Heartbreak", note: "Un morceau lent où il parle de ce qu'on peut avoir et pourtant se sentir seul." },
      { t: "Heartless", note: "Un des grands succès de l'album, sur une rupture, avec un rythme très simple." },
      { t: "Amazing" }, { t: "Love Lockdown", note: "Le premier single, très rythmé, avec des tambours puissants." },
      { t: "Paranoid" }, { t: "RoboCop" }, { t: "Street Lights" }, { t: "Bad News" }, { t: "See You in My Nightmares" }, { t: "Coldest Winter" },
      { t: "Pinocchio Story (Freestyle / Live From Singapore)" },
    ],
    mots: [
      m("heartbreak", "chagrin d'amour", "Heart (cœur) + break (casser). Adjectif : « heartbroken ».", "B1"),
      m("heartless", "sans cœur, cruel", "Suffixe « -less » = sans.", "B1"),
      m("a drum machine", "une boîte à rythmes", "Un appareil électronique qui joue des rythmes de batterie.", "B1"),
      m("lockdown", "confinement, verrouillage", "Connu pendant la pandémie ; ici vient de « to lock down ».", "B1"),
      m("a nightmare", "un cauchemar", "À ne pas confondre avec « a dream » (un rêve).", "B1"),
      m("a street light", "un lampadaire", "Une lumière dans la rue la nuit.", "A2"),
      m("paranoid", "méfiant, angoissé", "Qui pense que les autres lui veulent du mal.", "B2"),
      m("bad news", "mauvaises nouvelles", "« News » est singulier en anglais : « the news is bad ».", "A2"),
      m("lonely", "seul(e) et triste", "Différent de « alone » (simplement seul).", "B1"),
      m("amazing", "extraordinaire", "Adjectif très courant pour dire « génial ».", "A2"),
    ],
    quiz: [
      q("Que veut dire « heartbreak » ?", ["crise cardiaque", "chagrin d'amour", "battement de cœur", "joie"], 1, "Heartbreak = chagrin d'amour, cœur brisé."),
      q("« A nightmare » est…", ["un rêve agréable", "un cauchemar", "une nuit blanche", "un réveil"], 1, "A nightmare = un mauvais rêve, un cauchemar."),
      q("Le suffixe « -less » veut dire…", ["très", "sans", "encore", "moins"], 1, "-less = sans : heartless = sans cœur."),
      q("« News » est…", ["pluriel", "singulier", "toujours au passé", "un verbe"], 1, "News est singulier en anglais : « the news is good »."),
    ],
  },
  {
    id: "OLAK5uy_m6VFZd8KNhbFoHGRhtzFakGNVSkMMGvbU", titre: "Yeezus", artiste: "Kanye West", annee: 2013, label: "Def Jam / Roc-A-Fella", nbTitres: 10, vignette: "uU9Fe-WXew4", explicite: true, couleur: "#2B2B2B",
    histoire: "Yeezus est le sixième album de Kanye West, sorti en juin 2013. Il a été réalisé avec plusieurs producteurs dont le duo Daft Punk et Rick Rubin. Le son est très dur, minimaliste et électronique, loin de ses albums plus orchestrés. L'album ne contient que 10 titres et dure environ 40 minutes. À l'époque, la promotion a été très originale, sans publicité classique.",
    pourquoi: "Yeezus est resté célèbre pour son audace : Kanye y a pris le risque de faire une musique brute et déroutante. Beaucoup d'artistes citent cet album comme une grande influence. Il est court, donc facile à écouter en entier. Paroles explicites : il y a des mots crus et des thèmes adultes.",
    titres: [
      { t: "On Sight", note: "L'ouverture, très agressive, avec des sons électroniques." },
      { t: "Black Skinhead", note: "Un des titres les plus connus, avec un rythme de batterie répété." },
      { t: "I Am a God" }, { t: "New Slaves" }, { t: "Hold My Liquor" }, { t: "I'm In It" },
      { t: "Blood on the Leaves" }, { t: "Guilt Trip" }, { t: "Send It Up" },
      { t: "Bound 2", note: "Le morceau de fin, plus doux, avec un son de soul des années 70." },
    ],
    mots: [
      m("raw", "brut, cru", "Se dit d'un son, d'une émotion ou d'un aliment non préparé.", "B2"),
      m("bold", "audacieux", "Quelqu'un qui prend des risques.", "B2"),
      m("minimal", "minimaliste, réduit au strict nécessaire", "Peu d'instruments, peu de décors.", "B2"),
      m("industrial", "industriel", "Style de musique dur, avec des sons de machines.", "B2"),
      m("controversial", "qui fait polémique", "On dit d'un sujet ou d'une personne qui divise l'opinion.", "B2"),
      m("on sight", "à vue, dès qu'on le voit", "« Shoot on sight » : tirer à vue. Ici titre de piste.", "B2"),
      m("a guilt trip", "faire culpabiliser quelqu'un", "Expression familière : « to give someone a guilt trip ».", "B2"),
      m("bound", "lié à, destiné à", "« Bound for » = en route vers. « Bound to » = obligé de.", "B2"),
      m("to send up", "se moquer de, parodier", "Un « send-up » est une parodie (sens britannique).", "B2"),
      m("blood", "sang", "Le pluriel n'existe pas ; « bleed » = saigner.", "A2"),
    ],
    quiz: [
      q("Que veut dire « raw » ?", ["brut, cru", "rapide", "rouge", "rare"], 0, "Raw = brut, non travaillé."),
      q("Un album « minimal » est…", ["très chargé", "réduit à l'essentiel", "très long", "très ancien"], 1, "Minimal = réduit à l'essentiel."),
      q("« Controversial » veut dire…", ["controversé, qui divise", "très calme", "très célèbre", "contrôlé"], 0, "Controversial = qui provoque des débats."),
      q("Combien de titres compte Yeezus ?", ["5", "10", "20", "30"], 1, "Yeezus compte 10 titres, pour environ 40 minutes."),
    ],
  },
]

export const ARTISTES_ALBUMS = Array.from(new Set(ALBUMS.map(a => a.artiste)))
export const SPOTIFY_ALBUM = (a: Album) => `https://open.spotify.com/search/${encodeURIComponent(`${a.artiste} ${a.titre}`)}`
export const APPLE_MUSIC_ALBUM = (a: Album) => `https://music.apple.com/search?term=${encodeURIComponent(`${a.artiste} ${a.titre}`)}`
export const lecteurAlbum = (id: string) => `https://www.youtube-nocookie.com/embed/videoseries?list=${id}&rel=0&playsinline=1`
export const vignetteAlbum = (a: Album) => `https://i.ytimg.com/vi/${a.vignette}/hqdefault.jpg`

export const SPOTIFY = (c: Chanson) => `https://open.spotify.com/search/${encodeURIComponent(`${c.artiste} ${c.titre}`)}`
export const APPLE_MUSIC = (c: Chanson) => `https://music.apple.com/search?term=${encodeURIComponent(`${c.artiste} ${c.titre}`)}`
