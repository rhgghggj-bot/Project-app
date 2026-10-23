// Bibliothèque de l'espace étudiant.
//  - « lire » : classiques libres de droits, texte complet dans public/bibliotheque/<id>.json
//  - « fiche » : livres récents (protégés) : présentation et idées clés écrites pour l'appli,
//    jamais le texte du livre.
// L'avancement (statut, page, marque-pages, passages surlignés, jours de lecture) est gardé
// dans un fichier JSON de l'espace privé de l'élève : il suit d'un appareil à l'autre.

import { supabase } from "./supabase"

export const THEMES = ["Pouvoir et influence", "Argent", "Psychologie", "Stoïcisme", "Confiance en soi", "Productivité", "Philosophie de vie",
  "Philosophie", "Économie et société", "Histoire et géographie", "Littérature classique"] as const
export type Theme = (typeof THEMES)[number]

export type Livre = {
  id: string
  titre: string
  auteur: string
  annee: number
  pages: number
  type: "lire" | "fiche"
  texte?: boolean           // texte complet disponible (type « lire »)
  themes: Theme[]
  c: [string, string]       // couverture : fond, encre
  s: "cadre" | "bande"
  desc: string
  idees?: string[]
}

export const LIVRES: Livre[] = [
  // ─── Classiques à lire dans l'appli ───
  { id: "aphorismes", titre: "Aphorismes sur la sagesse dans la vie", auteur: "Arthur Schopenhauer", annee: 1851, pages: 300, type: "lire", texte: true, themes: ["Philosophie de vie", "Psychologie"], c: ["#1F3A33", "#E9D9A8"], s: "cadre",
    desc: "Le traité du bonheur de Schopenhauer : ce que l'on est compte plus que ce que l'on a et que ce que l'on paraît aux yeux des autres.",
    idees: ["Le bonheur dépend d'abord de ce que l'on est : caractère, santé, esprit.", "Les richesses et les honneurs ajoutent des soucis autant que des plaisirs.", "Une vie intérieure riche rend moins dépendant des circonstances et des autres."] },
  { id: "raison", titre: "L'Art d'avoir toujours raison", auteur: "Arthur Schopenhauer", annee: 1830, pages: 40, type: "lire", texte: true, themes: ["Pouvoir et influence", "Psychologie"], c: ["#5B1E1E", "#F1E4C9"], s: "bande",
    desc: "38 stratagèmes pour gagner une dispute même quand on a tort. À lire pour reconnaître ces ruses chez les autres et ne plus se laisser piéger.",
    idees: ["Une discussion se gagne souvent par la forme plus que par la vérité.", "Élargir l'affirmation de l'adversaire la rend plus facile à attaquer.", "L'attaque personnelle est le dernier recours de celui qui a perdu sur le fond."] },
  { id: "prudence", titre: "L'Art de la prudence", auteur: "Baltasar Gracián", annee: 1647, pages: 160, type: "lire", texte: true, themes: ["Pouvoir et influence", "Confiance en soi"], c: ["#2B2F4A", "#D8C38E"], s: "cadre",
    desc: "300 maximes d'un jésuite espagnol sur l'art de réussir parmi les autres (traduites sous le titre « L'Homme de cour »). L'ancêtre direct des « lois du pouvoir ».",
    idees: ["Ne pas tout dévoiler : le mystère entretient l'estime.", "Savoir choisir ses amis, ses combats et le bon moment.", "Laisser les autres sur leur faim plutôt que de les rassasier."] },
  { id: "maximes", titre: "Maximes", auteur: "La Rochefoucauld", annee: 1665, pages: 140, type: "lire", texte: true, themes: ["Psychologie", "Philosophie de vie"], c: ["#1E3A5A", "#E8D7AE"], s: "bande",
    desc: "Des phrases courtes et cruelles sur l'amour-propre et les vraies raisons de nos actes. À lire par petites doses.",
    idees: ["Nos vertus cachent souvent de l'intérêt ou de l'orgueil.", "L'amour-propre est le moteur caché de presque tout ce que nous faisons.", "Se connaître soi-même est plus difficile que connaître les autres."] },
  { id: "caracteres", titre: "Les Caractères", auteur: "Jean de La Bruyère", annee: 1688, pages: 470, type: "lire", texte: true, themes: ["Psychologie"], c: ["#4A2F1E", "#EAD9B5"], s: "cadre",
    desc: "Une galerie de portraits de la société : l'ambitieux, le flatteur, le distrait, le riche… Des types humains qu'on reconnaît encore aujourd'hui." },
  { id: "foules", titre: "Psychologie des foules", auteur: "Gustave Le Bon", annee: 1895, pages: 180, type: "lire", texte: true, themes: ["Psychologie", "Pouvoir et influence"], c: ["#2A2A2A", "#E7C873"], s: "bande",
    desc: "Comment un groupe pense et réagit autrement qu'un individu seul, et comment les meneurs le persuadent. Un classique de la persuasion de masse.",
    idees: ["Dans une foule, l'individu perd une partie de son esprit critique.", "Les foules réagissent aux images et aux affirmations répétées plus qu'aux raisonnements.", "Le prestige du meneur compte plus que ses arguments."] },
  { id: "methode", titre: "Discours de la méthode", auteur: "René Descartes", annee: 1637, pages: 85, type: "lire", texte: true, themes: ["Productivité", "Philosophie de vie"], c: ["#23395B", "#E3D3AA"], s: "cadre",
    desc: "Quatre règles simples pour bien réfléchir : douter, découper les difficultés, aller du simple au complexe, tout vérifier.",
    idees: ["Ne rien accepter comme vrai sans l'avoir vérifié.", "Diviser chaque difficulté en autant de parties que nécessaire.", "Avancer du plus simple au plus complexe, puis tout revoir."] },
  { id: "pensees-schopenhauer", titre: "Pensées, maximes et fragments", auteur: "Arthur Schopenhauer", annee: 1880, pages: 130, type: "lire", texte: true, themes: ["Philosophie de vie"], c: ["#3B2A3F", "#E6D6B0"], s: "bande",
    desc: "Le meilleur de Schopenhauer en courts passages : la souffrance, l'amour, l'art, la société. Sombre, lucide et souvent drôle." },
  { id: "richard", titre: "La Science du bonhomme Richard", auteur: "Benjamin Franklin", annee: 1758, pages: 15, type: "lire", texte: true, themes: ["Argent", "Productivité"], c: ["#2E4A2B", "#EED9A2"], s: "cadre",
    desc: "Les proverbes de Franklin sur le travail, l'épargne et le temps (« Le temps, c'est de l'argent »). Se lit en vingt minutes.",
    idees: ["Le temps perdu ne se rattrape jamais : c'est l'étoffe dont la vie est faite.", "Une petite dépense répétée finit par vider une grande bourse.", "Le travail régulier vaut mieux que l'espoir d'un coup de chance."] },
  { id: "candide", titre: "Candide, ou l'optimisme", auteur: "Voltaire", annee: 1759, pages: 130, type: "lire", texte: true, themes: ["Philosophie de vie"], c: ["#7A3B1D", "#F4E2BE"], s: "bande",
    desc: "Un jeune naïf traverse toutes les catastrophes du monde en répétant que « tout est pour le mieux ». La réponse finale : « il faut cultiver notre jardin »." },
  { id: "pensees", titre: "Pensées pour moi-même", auteur: "Marc Aurèle", annee: 180, pages: 300, type: "lire", texte: true, themes: ["Stoïcisme", "Philosophie de vie"], c: ["#4A3B2A", "#EADBB8"], s: "cadre",
    desc: "Le carnet personnel d'un empereur romain qui s'exerce chaque soir à rester calme, juste et maître de lui.",
    idees: ["Ce ne sont pas les choses qui nous troublent, mais l'idée que nous nous en faisons.", "Faire son devoir sans attendre de reconnaissance.", "Chaque journée est courte : ne pas la gaspiller en colère ou en plaintes."] },
  { id: "manuel", titre: "Manuel", auteur: "Épictète", annee: 125, pages: 60, type: "lire", texte: true, themes: ["Stoïcisme", "Confiance en soi"], c: ["#2F4A3E", "#E5E0C8"], s: "bande",
    desc: "Distinguer ce qui dépend de nous de ce qui n'en dépend pas : le cœur de la pensée stoïcienne, en 53 courts chapitres.",
    idees: ["Certaines choses dépendent de nous (nos jugements, nos actions), les autres non.", "Se concentrer sur ce qui dépend de nous apporte la paix intérieure.", "Ce qui nous blesse, c'est notre opinion sur l'événement plus que l'événement lui-même."] },
  { id: "prince", titre: "Le Prince", auteur: "Nicolas Machiavel", annee: 1532, pages: 150, type: "lire", texte: true, themes: ["Pouvoir et influence"], c: ["#7A2E17", "#F3DEB6"], s: "bande",
    desc: "Comment conquérir et garder le pouvoir, vu sans illusions. Le livre qui a donné son nom au mot « machiavélique ».",
    idees: ["Mieux vaut être craint qu'aimé, si l'on ne peut être les deux.", "La fortune gouverne la moitié de nos actions ; l'autre moitié dépend de nous.", "Un dirigeant est jugé sur ses résultats plus que sur ses moyens."] },

  // ─── Culture générale : livres libres de droits, en français ───
  { id: "contrat", titre: "Du contrat social", auteur: "Jean-Jacques Rousseau", annee: 1762, pages: 210, type: "lire", texte: true, themes: ["Philosophie"], c: ["#3B2F63", "#F0E2B6"], s: "cadre",
    desc: "Comment vivre sous des lois communes sans perdre sa liberté ? Rousseau répond par un pacte où chacun obéit à la volonté générale, c'est-à-dire à l'intérêt commun du peuple.",
    idees: ["L'homme naît libre, mais il est partout dans les fers : tout l'enjeu est de rendre cet ordre légitime.", "La force ne crée aucun droit : on n'est obligé d'obéir qu'aux pouvoirs légitimes.", "La loi doit exprimer la volonté générale : le peuple est le seul vrai souverain."] },
  { id: "apologie", titre: "Apologie de Socrate", auteur: "Platon", annee: -399, pages: 65, type: "lire", texte: true, themes: ["Philosophie"], c: ["#E4D6B2", "#3A2A14"], s: "bande",
    desc: "Le discours de Socrate devant ses juges athéniens, qui l'accusent de corrompre la jeunesse et de ne pas honorer les dieux. Il refuse de se renier, même au prix de sa vie.",
    idees: ["Une vie sans examen ne vaut pas la peine d'être vécue : Socrate interroge sans cesse les autres et lui-même.", "La vraie sagesse est de savoir que l'on ne sait pas tout.", "Mieux vaut suivre sa conscience que craindre la mort."] },
  { id: "persanes", titre: "Lettres persanes", auteur: "Montesquieu", annee: 1721, pages: 440, type: "lire", texte: true, themes: ["Philosophie"], c: ["#6A1F3B", "#F6E4C4"], s: "bande",
    desc: "Deux Persans voyagent en France et racontent leurs surprises par lettres. Ce regard d'étranger permet à Montesquieu de se moquer avec esprit des coutumes, de la religion et du pouvoir de son époque.",
    idees: ["Un regard venu d'ailleurs montre l'étrangeté de coutumes que l'on croit naturelles.", "Montesquieu critique le pouvoir absolu, l'intolérance et les privilèges.", "Le drame du sérail d'Usbek, qui se termine mal, montre ce que coûte la tyrannie."] },
  { id: "voit", titre: "Ce qu'on voit et ce qu'on ne voit pas", auteur: "Frédéric Bastiat", annee: 1850, pages: 90, type: "lire", texte: true, themes: ["Économie et société"], c: ["#E3EBD9", "#2D4A22"], s: "cadre",
    desc: "Un texte court et vif pour juger une mesure économique par tous ses effets, y compris ceux qu'on ne voit pas. La parabole de la vitre cassée en est l'exemple le plus célèbre.",
    idees: ["Toute décision a un effet visible et des effets cachés : un bon économiste regarde les deux.", "Casser une vitre fait travailler le vitrier, mais l'argent dépensé ne servira pas à autre chose.", "L'argent de l'État vient des contribuables : ce qu'il dépense n'est jamais gratuit."] },
  { id: "propriete", titre: "Qu'est-ce que la propriété ?", auteur: "Pierre-Joseph Proudhon", annee: 1840, pages: 465, type: "lire", texte: true, themes: ["Économie et société"], c: ["#4A0E0E", "#F2D8A7"], s: "bande",
    desc: "Le livre de la formule « la propriété, c'est le vol ». Proudhon examine les justifications de la propriété (occupation, travail, loi) et les conteste une à une au nom de l'égalité.",
    idees: ["La question posée est simple : qu'est-ce qui justifie qu'on possède la terre et les outils ?", "Selon Proudhon, ni l'occupation, ni le travail, ni la loi ne suffisent à le justifier.", "Il y oppose une société plus égale, où personne ne vit du travail des autres."] },
  { id: "manifeste", titre: "Manifeste du parti communiste", auteur: "Karl Marx et Friedrich Engels", annee: 1848, pages: 60, type: "lire", texte: true, themes: ["Économie et société"], c: ["#A31F18", "#FFF4DC"], s: "bande",
    desc: "Écrit en 1848, ce texte court présente l'histoire comme une suite de luttes entre classes sociales et défend l'idée d'une société sans classes. À lire pour comprendre ces idées, avec du recul.",
    idees: ["L'histoire de toute société est l'histoire de luttes de classes.", "La bourgeoisie a transformé le monde par l'industrie et le commerce, mais elle crée aussi la classe ouvrière qui la conteste.", "Les communistes veulent mettre en commun les moyens de production pour supprimer l'exploitation."] },
  { id: "democratie", titre: "De la démocratie en Amérique", auteur: "Alexis de Tocqueville", annee: 1835, pages: 330, type: "lire", texte: true, themes: ["Histoire et géographie"], c: ["#0B3C5D", "#F2D49B"], s: "cadre",
    desc: "Après un voyage aux États-Unis, un jeune Français étudie ce pays pour comprendre l'avenir des démocraties. Cette édition donne le premier tome : géographie, origines, commune, justice et Constitution fédérale.",
    idees: ["L'égalité des conditions avance partout : c'est un fait que l'on ne peut pas arrêter.", "Les Anglo-Américains sont partis d'une société presque égale, et cela explique leurs lois et leurs mœurs.", "La commune est l'école de la liberté : c'est en gérant les affaires locales que les citoyens apprennent à gouverner."] },
  { id: "nation", titre: "Qu'est-ce qu'une nation ?", auteur: "Ernest Renan", annee: 1882, pages: 35, type: "lire", texte: true, themes: ["Histoire et géographie"], c: ["#ECE4D3", "#1F3F7A"], s: "bande",
    desc: "Une conférence donnée à la Sorbonne en 1882. Renan écarte la race, la langue, la religion et la géographie : pour lui, une nation tient surtout à la volonté de vivre ensemble.",
    idees: ["Ni la race, ni la langue, ni la religion, ni les frontières naturelles ne suffisent à définir une nation.", "Une nation est une âme : un passé de souvenirs et de sacrifices partagés.", "Son existence est « un plébiscite de tous les jours », c'est-à-dire un choix renouvelé."] },
  { id: "tour80", titre: "Le Tour du monde en quatre-vingts jours", auteur: "Jules Verne", annee: 1873, pages: 360, type: "lire", texte: true, themes: ["Histoire et géographie"], c: ["#0B5B5F", "#FBE8B4"], s: "cadre",
    desc: "Pour gagner un pari, le gentleman Phileas Fogg et son domestique Passepartout font le tour de la Terre en train, en bateau et même à dos d'éléphant. Un roman d'aventures qui fait voyager à travers les pays et les techniques de 1872.",
    idees: ["Fogg parie vingt mille livres qu'il fera le tour du monde en 80 jours, grâce aux chemins de fer et aux bateaux à vapeur.", "Le voyage passe par l'Égypte, l'Inde, la Chine, le Japon et les États-Unis avant le retour à Londres.", "Le détective Fix le suit partout, persuadé qu'il est un voleur de banque."] },
  { id: "romains", titre: "Grandeur et décadence des Romains", auteur: "Montesquieu", annee: 1734, pages: 230, type: "lire", texte: true, themes: ["Histoire et géographie"], c: ["#8A3418", "#FBEBD0"], s: "bande",
    desc: "Dans ses « Considérations sur les causes de la grandeur des Romains et de leur décadence », Montesquieu cherche pourquoi Rome a conquis le monde puis s'est effondrée. Pour lui, ce sont les mœurs, les institutions et les erreurs politiques qui l'expliquent.",
    idees: ["Rome grandit grâce à l'esprit civique de ses citoyens, à son armée disciplinée et à sa politique envers les peuples vaincus.", "Ce n'est pas le hasard qui gouverne le monde : des causes générales, morales ou physiques, élèvent ou font tomber chaque État.", "Les guerres civiles et la corruption affaiblissent la République, puis l'Empire se défait peu à peu."] },
  { id: "condamne", titre: "Le Dernier Jour d'un condamné", auteur: "Victor Hugo", annee: 1829, pages: 180, type: "lire", texte: true, themes: ["Littérature classique"], c: ["#1A1A1A", "#F08A7A"], s: "cadre",
    desc: "Un homme condamné à mort raconte ses dernières semaines, jusqu'à l'échafaud. Hugo ne donne ni son nom ni son crime : il veut faire sentir l'angoisse d'un condamné et plaider contre la peine de mort.",
    idees: ["Le narrateur reste anonyme : ce qui compte, c'est ce que vit tout condamné.", "Le récit montre la peur, l'attente et la cruauté d'une justice qui tue.", "La préface de 1832 en fait un plaidoyer direct pour l'abolition de la peine de mort."] },
  { id: "boule", titre: "Boule de suif", auteur: "Guy de Maupassant", annee: 1880, pages: 70, type: "lire", texte: true, themes: ["Littérature classique"], c: ["#F3E1D8", "#6B1F2E"], s: "bande",
    desc: "En 1870, dix voyageurs fuient Rouen occupée par les Prussiens. Boule de suif, une prostituée, partage ses provisions avec eux ; ils lui demandent ensuite un sacrifice, puis la rejettent.",
    idees: ["Maupassant montre l'hypocrisie de ceux qui se croient respectables.", "Les passagers acceptent la générosité de Boule de suif, puis la méprisent.", "La guerre et l'occupation révèlent les égoïsmes plus que les héroïsmes."] },
  { id: "avare", titre: "L'Avare", auteur: "Molière", annee: 1668, pages: 110, type: "lire", texte: true, themes: ["Littérature classique"], c: ["#D2A93B", "#241704"], s: "cadre",
    desc: "Harpagon aime son argent plus que tout et veut marier ses enfants selon son intérêt. Le vol de sa cassette fait éclater cette comédie.",
    idees: ["L'avarice rend Harpagon ridicule, et dur même avec ses propres enfants.", "Cléante et Élise cherchent à échapper aux mariages choisis par leur père.", "« Il faut manger pour vivre, et non pas vivre pour manger » : Molière tire du rire une leçon de morale."] },

  // ─── Livres récents : fiches ───
  { id: "loi50", titre: "La 50e loi", auteur: "Robert Greene et 50 Cent", annee: 2009, pages: 300, type: "fiche", themes: ["Confiance en soi", "Pouvoir et influence"], c: ["#0F0F10", "#D7B45A"], s: "bande",
    desc: "Le parcours de 50 Cent sert de fil rouge à une idée : ne plus avoir peur. Voir la réalité telle qu'elle est et agir quand même.",
    idees: ["La peur fausse le jugement : on la combat en regardant les faits en face.", "Transformer chaque difficulté en ressource plutôt que de la subir.", "Garder l'initiative au lieu d'attendre que les autres décident pour soi.", "Apprendre à être à l'aise avec l'inconfort et l'incertitude."] },
  { id: "lois48", titre: "Les 48 lois du pouvoir", auteur: "Robert Greene", annee: 1998, pages: 450, type: "fiche", themes: ["Pouvoir et influence"], c: ["#5E1416", "#E9C86A"], s: "cadre",
    desc: "Un catalogue des stratégies de pouvoir tirées de l'histoire, illustrées par des exemples de rois, d'escrocs et de courtisans.",
    idees: ["Le pouvoir est un jeu social : en connaître les règles aide au moins à se défendre.", "Chaque « loi » est illustrée par des exemples historiques et ses exceptions.", "Décrire une stratégie n'est pas la recommander : à lire avec recul."] },
  { id: "nature-humaine", titre: "Les lois de la nature humaine", auteur: "Robert Greene", annee: 2018, pages: 600, type: "fiche", themes: ["Psychologie", "Pouvoir et influence"], c: ["#1B2A3A", "#D9B86A"], s: "cadre",
    desc: "Comprendre les forces qui poussent les gens à agir (envie, narcissisme, irrationalité) pour mieux lire les autres et se maîtriser soi-même.",
    idees: ["Nous sommes plus émotifs et moins rationnels que nous le croyons.", "Observer les comportements plutôt que les paroles révèle le vrai caractère.", "Reconnaître ses propres faiblesses permet de ne pas être manipulé par elles."] },
  { id: "mastery", titre: "Atteindre l'excellence", auteur: "Robert Greene", annee: 2012, pages: 380, type: "fiche", themes: ["Productivité", "Confiance en soi"], c: ["#3A2A14", "#EBCB7A"], s: "bande",
    desc: "Comment les grands maîtres (scientifiques, artistes, entrepreneurs) sont devenus excellents : vocation, apprentissage long, créativité.",
    idees: ["Trouver ce qui nous attire vraiment depuis toujours.", "Accepter une longue période d'apprentissage patient.", "La maîtrise vient de milliers d'heures de pratique attentive."] },
  { id: "cialdini", titre: "Influence et manipulation", auteur: "Robert Cialdini", annee: 1984, pages: 320, type: "fiche", themes: ["Psychologie", "Pouvoir et influence"], c: ["#E3B23C", "#1B1B1B"], s: "bande",
    desc: "Les grands mécanismes qui nous font dire oui, et comment s'en protéger.",
    idees: ["Réciprocité : on se sent obligé de rendre ce qu'on a reçu.", "Engagement : après un petit oui, on dit plus facilement un grand oui.", "Preuve sociale : on fait comme les autres quand on hésite.", "Autorité, sympathie et rareté complètent la liste des leviers."] },
  { id: "carnegie", titre: "Comment se faire des amis", auteur: "Dale Carnegie", annee: 1936, pages: 260, type: "fiche", themes: ["Pouvoir et influence", "Confiance en soi"], c: ["#B9322B", "#FBEFD8"], s: "cadre",
    desc: "Les règles simples des relations humaines, toujours d'actualité près d'un siècle plus tard.",
    idees: ["Ne pas critiquer, ne pas condamner, ne pas se plaindre.", "S'intéresser sincèrement aux autres et les écouter.", "Le prénom d'une personne est pour elle le plus doux des sons.", "Faire parler l'autre de ce qui l'intéresse."] },
  { id: "voss", titre: "Ne coupez jamais la poire en deux", auteur: "Chris Voss", annee: 2016, pages: 300, type: "fiche", themes: ["Pouvoir et influence", "Psychologie"], c: ["#152B3C", "#F1C24B"], s: "bande",
    desc: "Les techniques de négociation d'un ancien négociateur du FBI : l'écoute et l'empathie tactique plutôt que la logique pure.",
    idees: ["Reformuler les derniers mots de l'autre l'encourage à en dire plus.", "Nommer les émotions de l'autre (« on dirait que… ») apaise la discussion.", "Un « non » ouvre souvent la vraie négociation.", "Poser des questions ouvertes qui commencent par « comment » ou « qu'est-ce que »."] },
  { id: "housel", titre: "La psychologie de l'argent", auteur: "Morgan Housel", annee: 2020, pages: 250, type: "fiche", themes: ["Argent", "Psychologie"], c: ["#E7E2D3", "#1D3A2F"], s: "cadre",
    desc: "Bien gérer son argent dépend moins de ce que l'on sait que de la façon dont on se comporte. Des histoires courtes sur la peur, l'envie et la patience.",
    idees: ["Le comportement compte plus que l'intelligence en matière d'argent.", "La chance et le risque jouent un rôle plus grand qu'on ne l'admet.", "Savoir ce qui est « assez » protège des risques inutiles.", "Le temps fait le travail : la régularité bat les coups d'éclat.", "Devenir riche et rester riche demandent des qualités différentes.", "La vraie valeur de l'argent : la liberté de disposer de son temps."] },
  { id: "kiyosaki", titre: "Père riche, père pauvre", auteur: "Robert Kiyosaki", annee: 1997, pages: 230, type: "fiche", themes: ["Argent"], c: ["#5A2D82", "#F2D35B"], s: "bande",
    desc: "Deux pères, deux visions de l'argent. Un livre très populaire, à lire avec esprit critique, pour distinguer ce qui rapporte de ce qui coûte.",
    idees: ["Un actif met de l'argent dans ta poche, un passif en retire.", "Apprendre à comprendre les chiffres (éducation financière) plutôt que d'en avoir peur.", "Ne pas confondre un salaire élevé avec la richesse."] },
  { id: "babylone", titre: "L'homme le plus riche de Babylone", auteur: "George S. Clason", annee: 1926, pages: 150, type: "fiche", themes: ["Argent"], c: ["#5B3A1A", "#F0D18A"], s: "cadre",
    desc: "Des paraboles situées dans l'ancienne Babylone pour apprendre les règles de base de l'épargne et de l'investissement.",
    idees: ["Mettre de côté au moins un dixième de ce que l'on gagne.", "Faire travailler son argent plutôt que de le laisser dormir.", "Se méfier des placements qu'on ne comprend pas."] },
  { id: "investisseur", titre: "L'investisseur intelligent", auteur: "Benjamin Graham", annee: 1949, pages: 600, type: "fiche", themes: ["Argent"], c: ["#1F3B4D", "#E2E8EC"], s: "bande",
    desc: "La bible de l'investissement prudent : distinguer investir et spéculer, et garder son calme quand le marché s'agite.",
    idees: ["Le marché est un partenaire d'humeur changeante : en profiter, pas le suivre.", "Toujours garder une marge de sécurité.", "Investir, c'est analyser la valeur ; spéculer, c'est parier sur le prix."] },
  { id: "kahneman", titre: "Système 1 / Système 2", auteur: "Daniel Kahneman", annee: 2011, pages: 500, type: "fiche", themes: ["Psychologie"], c: ["#F4F1EA", "#2A4D8F"], s: "cadre",
    desc: "Deux façons de penser, l'une rapide et intuitive, l'autre lente et réfléchie, et les erreurs que la première nous fait commettre.",
    idees: ["Le système 1 décide vite et se trompe de façon prévisible.", "Une perte nous touche plus qu'un gain de même montant.", "Le premier chiffre entendu influence nos estimations (effet d'ancrage)."] },
  { id: "courage", titre: "Avoir le courage de ne pas être aimé", auteur: "Ichiro Kishimi et Fumitake Koga", annee: 2013, pages: 280, type: "fiche", themes: ["Confiance en soi", "Psychologie"], c: ["#F2E6D8", "#B23A2E"], s: "bande",
    desc: "Un dialogue entre un jeune homme et un philosophe, inspiré de la psychologie d'Alfred Adler, sur la liberté d'être soi.",
    idees: ["Le passé ne nous condamne pas : nous choisissons le sens que nous lui donnons.", "Séparer les tâches : ce que pensent les autres est leur affaire, pas la nôtre.", "Chercher sans cesse la reconnaissance rend dépendant.", "Être libre, c'est accepter de déplaire parfois."] },
  { id: "manson", titre: "L'art subtil de s'en foutre", auteur: "Mark Manson", annee: 2016, pages: 220, type: "fiche", themes: ["Confiance en soi", "Philosophie de vie"], c: ["#F28C28", "#111111"], s: "bande",
    desc: "Une manière directe de choisir ce qui compte vraiment et d'arrêter de vouloir être positif à tout prix.",
    idees: ["On ne peut pas se soucier de tout : il faut choisir ses combats.", "Les problèmes ne disparaissent pas, on choisit les bons problèmes.", "Assumer la responsabilité de sa vie, même de ce qui n'est pas sa faute."] },
  { id: "tolteques", titre: "Les quatre accords toltèques", auteur: "Don Miguel Ruiz", annee: 1997, pages: 130, type: "fiche", themes: ["Philosophie de vie", "Confiance en soi"], c: ["#1E4D5C", "#F2E3B3"], s: "cadre",
    desc: "Quatre règles de vie très simples, faciles à retenir et difficiles à appliquer.",
    idees: ["Que ta parole soit impeccable.", "Ne réagis à rien de façon personnelle.", "Ne fais aucune supposition.", "Fais toujours de ton mieux."] },
  { id: "frankl", titre: "Découvrir un sens à sa vie", auteur: "Viktor Frankl", annee: 1946, pages: 170, type: "fiche", themes: ["Psychologie", "Philosophie de vie"], c: ["#2D2D2D", "#E8DDC8"], s: "bande",
    desc: "Un psychiatre rescapé des camps de concentration montre que l'humain peut supporter presque tout s'il trouve un sens à ce qu'il vit.",
    idees: ["On peut tout enlever à un homme, sauf la liberté de choisir son attitude.", "Celui qui a un « pourquoi » supporte presque n'importe quel « comment ».", "Le sens se trouve dans une œuvre, un amour ou une attitude face à l'épreuve."] },
  { id: "dweck", titre: "Changer d'état d'esprit", auteur: "Carol Dweck", annee: 2006, pages: 300, type: "fiche", themes: ["Confiance en soi", "Psychologie"], c: ["#2F6B8F", "#F3F0E6"], s: "cadre",
    desc: "La différence entre croire que ses capacités sont fixées et croire qu'elles se développent, et ce que cela change pour réussir.",
    idees: ["Avec un état d'esprit de progression, l'échec devient une information.", "Féliciter l'effort plutôt que le talent encourage à persévérer.", "Le mot « pas encore » change notre rapport à la difficulté."] },
  { id: "holiday", titre: "L'obstacle est le chemin", auteur: "Ryan Holiday", annee: 2014, pages: 220, type: "fiche", themes: ["Stoïcisme", "Confiance en soi"], c: ["#3B3A36", "#E4C68C"], s: "bande",
    desc: "Le stoïcisme appliqué : ce qui nous bloque peut devenir ce qui nous fait avancer.",
    idees: ["Percevoir : voir l'obstacle sans dramatiser.", "Agir : avancer pas à pas, avec persévérance.", "Accepter : vouloir ce qui arrive et en tirer le meilleur."] },
  { id: "ego", titre: "L'ego est l'ennemi", auteur: "Ryan Holiday", annee: 2016, pages: 230, type: "fiche", themes: ["Stoïcisme", "Productivité"], c: ["#E9E4D8", "#7A1F1F"], s: "cadre",
    desc: "Comment l'ego nous freine quand on débute, nous aveugle quand on réussit et nous enfonce quand on échoue.",
    idees: ["Rester un éternel étudiant.", "Parler moins, faire plus.", "Mesurer sa réussite à ses propres critères, pas à la reconnaissance."] },
  { id: "covey", titre: "Les 7 habitudes de ceux qui réalisent tout ce qu'ils entreprennent", auteur: "Stephen R. Covey", annee: 1989, pages: 400, type: "fiche", themes: ["Productivité", "Confiance en soi"], c: ["#1D3557", "#F1FAEE"], s: "bande",
    desc: "Sept habitudes pour passer de la dépendance à l'autonomie, puis à la coopération.",
    idees: ["Être proactif : agir sur ce qui dépend de soi.", "Commencer avec la fin en tête.", "Donner la priorité à l'important plutôt qu'à l'urgent.", "Chercher d'abord à comprendre, ensuite à être compris."] },
  { id: "tolle", titre: "Le pouvoir du moment présent", auteur: "Eckhart Tolle", annee: 1997, pages: 240, type: "fiche", themes: ["Philosophie de vie", "Psychologie"], c: ["#F5EFE0", "#6A4C93"], s: "cadre",
    desc: "Apprendre à observer ses pensées sans s'y identifier pour vivre davantage dans l'instant présent.",
    idees: ["Nous ne sommes pas nos pensées : nous pouvons les observer.", "La souffrance vient souvent du refus de ce qui est.", "Le moment présent est le seul où l'on peut agir."] },
  { id: "clear", titre: "Un rien peut tout changer", auteur: "James Clear", annee: 2018, pages: 320, type: "fiche", themes: ["Productivité", "Confiance en soi"], c: ["#F6F3EC", "#1A1A1A"], s: "bande",
    desc: "De petites habitudes, répétées chaque jour, produisent de grands résultats. Comment les installer et les garder.",
    idees: ["S'améliorer de 1 % par jour finit par tout changer.", "Rendre une bonne habitude évidente, attrayante, facile et satisfaisante.", "Viser une identité (« je suis quelqu'un qui… ») plutôt qu'un résultat."] },
  { id: "newport", titre: "Deep Work", auteur: "Cal Newport", annee: 2016, pages: 300, type: "fiche", themes: ["Productivité"], c: ["#24323F", "#DCE6EE"], s: "cadre",
    desc: "Le travail concentré, sans distraction, devient rare et précieux. Comment le protéger.",
    idees: ["Bloquer de longues plages sans téléphone ni notifications.", "S'entraîner à s'ennuyer plutôt que de combler chaque pause.", "Réduire le travail superficiel (mails, réunions) au strict nécessaire."] },
  { id: "essentialisme", titre: "L'essentialisme", auteur: "Greg McKeown", annee: 2014, pages: 270, type: "fiche", themes: ["Productivité", "Philosophie de vie"], c: ["#FFFFFF", "#C1121F"], s: "bande",
    desc: "Faire moins, mais mieux : choisir l'essentiel et oser dire non au reste.",
    idees: ["Si ce n'est pas un « oui, absolument », c'est un non.", "Protéger son temps comme sa ressource la plus rare.", "Supprimer ce qui ne compte pas plutôt que d'en faire plus."] },
  { id: "one-thing", titre: "The One Thing", auteur: "Gary Keller et Jay Papasan", annee: 2013, pages: 240, type: "fiche", themes: ["Productivité"], c: ["#111827", "#F59E0B"], s: "cadre",
    desc: "Trouver la seule chose qui rendra toutes les autres plus faciles ou inutiles, et s'y consacrer en premier.",
    idees: ["Se demander : quelle est la seule chose que je peux faire maintenant qui rendra le reste plus facile ?", "Le multitâche fait perdre du temps et de la qualité.", "Bloquer chaque jour un moment pour l'essentiel."] },
  { id: "ikigai", titre: "Ikigai", auteur: "Héctor García et Francesc Miralles", annee: 2016, pages: 200, type: "fiche", themes: ["Philosophie de vie"], c: ["#F4E9E1", "#B5342A"], s: "bande",
    desc: "Ce que les habitants d'Okinawa, parmi les plus vieux du monde, enseignent sur une vie longue et pleine de sens.",
    idees: ["Avoir une raison de se lever le matin.", "Rester actif et entouré, sans se presser.", "Trouver un rythme où l'on oublie le temps (le « flow »)."] },
  { id: "alchimiste", titre: "L'Alchimiste", auteur: "Paulo Coelho", annee: 1988, pages: 190, type: "fiche", themes: ["Philosophie de vie", "Confiance en soi"], c: ["#E9C46A", "#264653"], s: "cadre",
    desc: "Un roman court : un jeune berger part à la recherche d'un trésor et découvre ce qu'il cherchait vraiment.",
    idees: ["Suivre sa « légende personnelle », même quand c'est difficile.", "Les obstacles font partie du chemin.", "Ce que l'on cherche est parfois plus proche qu'on ne le croit."] },
]

export function livre(id: string) { return LIVRES.find(l => l.id === id) }

// ─── Texte d'un livre ───
export type Bloc = ["c" | "h" | "s" | "p" | "v", string] | ["n", string, string]
export type Chapitre = { titre: string; blocs: Bloc[] }
export type TexteLivre = { titre: string; auteur: string; traducteur: string | null; source: string; chapitres: Chapitre[] }

const textes = new Map<string, Promise<TexteLivre>>()
export function chargerTexte(id: string): Promise<TexteLivre> {
  if (!textes.has(id)) {
    textes.set(id, fetch(`/bibliotheque/${id}.json`).then(r => {
      if (!r.ok) throw new Error("Livre introuvable")
      return r.json()
    }).catch(e => { textes.delete(id); throw e }))
  }
  return textes.get(id)!
}

// ─── Avancement de l'élève ───
export type Position = { c: number; b: number; pct?: number }   // pct : avancement 0-100 pour l'accueil
export type Passage = { livre: string; c: number; b: number; t: string; le: string }
export type EtatBiblio = {
  statuts: Record<string, "alire" | "encours" | "lu">
  positions: Record<string, Position>
  signets: Record<string, Position[]>
  passages: Passage[]
  dernier: string | null
  jours: string[]
  notes: Record<string, string>   // note du carnet créée pour un livre (citations)
}
export const ETAT_VIDE: EtatBiblio = { statuts: {}, positions: {}, signets: {}, passages: [], dernier: null, jours: [], notes: {} }

const chemin = (uid: string) => `${uid}/bibliotheque/etat.json`

export async function chargerEtat(uid: string): Promise<EtatBiblio> {
  const { data } = await supabase.storage.from("etudes").download(chemin(uid))
  if (!data) return { ...ETAT_VIDE }
  try { return { ...ETAT_VIDE, ...JSON.parse(await data.text()) } } catch { return { ...ETAT_VIDE } }
}

export async function enregistrerEtat(uid: string, e: EtatBiblio): Promise<boolean> {
  const { error } = await supabase.storage.from("etudes").upload(chemin(uid),
    new Blob([JSON.stringify(e)], { type: "application/json" }), { upsert: true, contentType: "application/json" })
  return !error
}

export function jourISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// Jours de lecture d'affilée (jusqu'à aujourd'hui ou hier)
export function serie(jours: string[]): number {
  const set = new Set(jours)
  const d = new Date()
  if (!set.has(jourISO(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (set.has(jourISO(d))) { n++; d.setDate(d.getDate() - 1) }
  return n
}

export function noterJour(e: EtatBiblio): EtatBiblio {
  const j = jourISO()
  return e.jours.includes(j) ? e : { ...e, jours: [...e.jours, j].slice(-90) }
}
