"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { chargerArticle, lienWikipedia, type ArticleWiki } from "@/lib/wikipedia"
import s from "./atlas.module.css"

// Globe 3D (MapLibre), chargé seulement quand on l'utilise
const GlobeCarte = dynamic(() => import("./GlobeCarte"), { ssr: false, loading: () => <div className="nx-skel" style={{ position: "absolute", inset: 16, borderRadius: 16 }} /> })
const webglPossible = () => { try { return !!document.createElement("canvas").getContext("webgl2") } catch { return false } }

// Atlas du monde : carte à déplacer et zoomer (doigt, souris, molette), et
// fiche détaillée de chaque pays. Chiffres : Banque mondiale et UNESCO
// (public/atlas/pays.json, préparé à l'avance) ; textes d'histoire et de
// politique : Wikipédia, chargés quand on ouvre l'onglet.

type Valeur = [number, number]                  // [année, valeur]
type Serie = Valeur[]
type D = Record<string, Valeur | Serie | undefined> & {
  filieres?: { an: number; parts: [string, number][] }
}
type Pays = {
  nom: string; i2?: string; region: string; revenu?: string; capitale?: string; langues?: string[]; monnaie?: string[]; voisins?: string[]; enclave?: boolean
  regime?: string[]; fonctionEtat?: string; fonctionGouv?: string; creation?: number; orgs?: string[]; wiki?: string; wikiHistoire?: string
  rangs?: Record<string, [number, number]>; d: D
}
type Carte = { w: number; h: number; pays: { iso: string; n: string; d: string; c: [number, number] }[] }
type Donnees = { maj: string; sources: string; pays: Record<string, Pays> }

const ONGLETS = ["Aperçu", "Économie", "Commerce", "Population", "Éducation", "Politique", "Histoire"] as const
type Onglet = (typeof ONGLETS)[number]

// ─── Mise en forme ───
const nf = (n: number, max = 1) => n.toLocaleString("fr-CH", { maximumFractionDigits: max })
const montant = (n: number) => Math.abs(n) >= 1e12 ? `${nf(n / 1e12, 2)} billions $` : Math.abs(n) >= 1e9 ? `${nf(n / 1e9, 1)} milliards $` : Math.abs(n) >= 1e6 ? `${nf(n / 1e6, 1)} millions $` : `${nf(n, 0)} $`
const gens = (n: number) => n >= 1e9 ? `${nf(n / 1e9, 2)} milliards` : n >= 1e6 ? `${nf(n / 1e6, 1)} millions` : nf(n, 0)
const pct = (n: number, max = 1) => `${nf(n, max)} %`
const estSerie = (v: Valeur | Serie | undefined): v is Serie => Array.isArray(v?.[0])
const dernier = (v: Valeur | Serie | undefined): Valeur | undefined => (v ? (estSerie(v) ? v[v.length - 1] : v) : undefined)
const drapeau = (i2?: string) => (i2 && /^[A-Z]{2}$/.test(i2) ? String.fromCodePoint(...[...i2].map(c => 0x1f1e6 + c.charCodeAt(0) - 65)) : "")

// Type d'économie, déduit des chiffres (règles simples, expliquées à l'élève)
function typeEconomie(p: Pays): { titre: string; pourquoi: string[] } | null {
  const v = (k: string) => dernier(p.d[k])?.[1]
  const agri = v("vaAgri"), indus = v("vaIndus"), serv = v("vaServ"), empAgri = v("empAgri"), carbu = v("expCarbu"), minerais = v("expMinerais"), manuf = v("expManuf"), transf = v("transferts"), ouv = v("ouverture")
  const croiss = dernier(p.d.croissance)?.[1]
  if (agri == null && serv == null) return null
  let titre: string
  const pourquoi: string[] = []
  if (carbu != null && carbu >= 50) { titre = "Économie de rente pétrolière et gazière"; pourquoi.push(`le pétrole et le gaz font ${pct(carbu, 0)} des exportations de marchandises`) }
  else if (minerais != null && minerais >= 40) { titre = "Économie minière"; pourquoi.push(`les minerais et métaux font ${pct(minerais, 0)} des exportations de marchandises`) }
  else if ((agri != null && agri >= 20) || (empAgri != null && empAgri >= 40)) { titre = "Économie à dominante agricole (secteur primaire)"; if (agri != null) pourquoi.push(`l'agriculture produit ${pct(agri, 0)} de la richesse`); if (empAgri != null) pourquoi.push(`${pct(empAgri, 0)} des travailleurs sont dans l'agriculture`) }
  else if (serv != null && serv >= 70) { titre = "Économie tertiaire avancée (services)"; pourquoi.push(`les services produisent ${pct(serv, 0)} de la richesse`) }
  else if (indus != null && indus >= 35) { titre = "Économie industrielle (secteur secondaire fort)"; pourquoi.push(`l'industrie produit ${pct(indus, 0)} de la richesse`) }
  else { titre = "Économie diversifiée, à dominante de services"; if (serv != null) pourquoi.push(`les services produisent ${pct(serv, 0)} de la richesse`) }
  if (p.revenu === "revenu élevé") titre += ", pays développé"
  else if ((p.revenu?.startsWith("revenu intermédiaire")) && croiss != null && croiss >= 4) titre += ", pays émergent"
  else if (p.revenu === "faible revenu") titre += ", pays en développement"
  if (manuf != null && manuf >= 60) pourquoi.push(`ses exportations sont surtout des produits manufacturés (${pct(manuf, 0)})`)
  if (transf != null && transf >= 10) pourquoi.push(`l'argent envoyé par les émigrés pèse ${pct(transf, 0)} du PIB`)
  if (ouv != null && ouv >= 100) pourquoi.push(`très ouverte au commerce (échanges = ${pct(ouv, 0)} du PIB)`)
  if (p.revenu) pourquoi.push(`classée « ${p.revenu} » par la Banque mondiale`)
  return { titre, pourquoi }
}

// ─── Petits composants d'affichage ───
const An = ({ v }: { v?: Valeur }) => (v ? <span className={s.an}> ({v[0]})</span> : null)

function Ligne({ nom, v, f }: { nom: string; v?: Valeur; f: (n: number) => string }) {
  if (!v) return null
  return <div className={s.ligne}><span>{nom}</span><span>{f(v[1])}<An v={v} /></span></div>
}

function Chiffre({ nom, v, f }: { nom: string; v?: Valeur; f: (n: number) => string }) {
  if (!v) return null
  return <div className={s.chiffre}><b>{f(v[1])}</b><span>{nom}<An v={v} /></span></div>
}

// Barres horizontales empilées (100 %) : secteurs, âges…
function Repartition({ titre, parts, an }: { titre: string; parts: { nom: string; v?: number; c: string }[]; an?: number }) {
  const ok = parts.filter(p => p.v != null) as { nom: string; v: number; c: string }[]
  if (ok.length < 2) return null
  const total = ok.reduce((a, p) => a + p.v, 0) || 1
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{titre}{an ? <span className={s.an}> ({an})</span> : null}</div>
      <div role="img" aria-label={ok.map(p => `${p.nom} ${nf(p.v)} %`).join(", ")} style={{ display: "flex", height: 22, borderRadius: 6, overflow: "hidden", gap: 2 }}>
        {ok.map(p => <span key={p.nom} style={{ width: `${(100 * p.v) / total}%`, background: p.c }} />)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 6, fontSize: 12.5 }}>
        {ok.map(p => <span key={p.nom}><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: p.c, marginRight: 5 }} />{p.nom} <b style={{ fontVariantNumeric: "tabular-nums" }}>{nf(p.v)} %</b></span>)}
      </div>
    </div>
  )
}

// Évolution sur plusieurs années (barres verticales, valeurs écrites)
function Evolution({ titre, serie, f, couleur = "#2B6BE6" }: { titre: string; serie?: Valeur | Serie; f: (n: number) => string; couleur?: string }) {
  if (!estSerie(serie) || serie.length < 2) return null
  const max = Math.max(...serie.map(x => Math.abs(x[1]))) || 1
  const negatif = serie.some(x => x[1] < 0)
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{titre}</div>
      <div style={{ display: "flex", alignItems: negatif ? "center" : "flex-end", gap: 6, height: 110 }}>
        {serie.map(([an, v]) => (
          <div key={an} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: negatif ? "center" : "flex-end", height: "100%" }}
            title={`${an} : ${f(v)}`}>
            <span style={{ fontSize: 10.5, color: "#333", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{f(v)}</span>
            <span style={{ width: "100%", maxWidth: 34, height: `${Math.max(3, (70 * Math.abs(v)) / max)}px`, background: v < 0 ? "#D9485F" : couleur, borderRadius: v < 0 ? "0 0 4px 4px" : "4px 4px 0 0" }} />
            <span style={{ fontSize: 10.5, color: "#8A93A3", marginTop: 2 }}>{an}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Texte de Wikipédia (introduction + sections dépliables)
function TexteWiki({ titre, sections: filtre, ouvrirTout }: { titre?: string; sections?: RegExp; ouvrirTout?: boolean }) {
  const [etat, setEtat] = useState<{ pour?: string; article?: ArticleWiki; erreur?: string }>({})
  useEffect(() => {
    if (!titre) return
    let actif = true
    chargerArticle(titre).then(a => { if (actif) setEtat({ pour: titre, article: a }) }).catch(e => { if (actif) setEtat({ pour: titre, erreur: e instanceof Error ? e.message : "Erreur" }) })
    return () => { actif = false }
  }, [titre])
  if (!titre) return <p className={s.vide}>Pas d&apos;article Wikipédia associé.</p>
  if (etat.pour !== titre) return <div className="nx-skel" style={{ height: 160, borderRadius: 12 }} />
  if (!etat.article) return <p className={s.vide}>Wikipédia ne répond pas pour le moment (connexion ?). <a href={lienWikipedia(titre)} target="_blank" rel="noopener noreferrer">Lire l&apos;article sur Wikipédia</a></p>
  const a = etat.article
  const sections = filtre ? a.sections.filter(x => filtre.test(x.titre)) : a.sections
  return (
    <div className={s.wiki}>
      {!filtre && a.intro.map((p, i) => <p key={i}>{p}</p>)}
      {sections.map((sec, i) => (
        <details key={sec.titre + i} open={ouvrirTout || i === 0}>
          <summary>{sec.titre}</summary>
          {sec.blocs.map((b, j) => (b.t === "h" ? <h4 key={j}>{b.x}</h4> : <p key={j}>{b.x}</p>))}
        </details>
      ))}
      {filtre && !sections.length && <p className={s.vide}>Cette partie n&apos;existe pas dans l&apos;article.</p>}
      <p className={s.source}>Texte : Wikipédia, « <a href={a.url} target="_blank" rel="noopener noreferrer">{a.titre}</a> » (licence CC BY-SA).</p>
    </div>
  )
}

// ─── Fiche d'un pays ───
function Fiche({ p, onglet }: { p: Pays; onglet: Onglet }) {
  const d = p.d
  const v = (k: string) => dernier(d[k])
  const rang = (k: string, nom: string) => p.rangs?.[k] ? <div className={s.ligne}><span>Rang mondial ({nom})</span><span>{p.rangs[k][0]}<sup>e</sup> sur {p.rangs[k][1]}</span></div> : null
  const type = typeEconomie(p)

  if (onglet === "Aperçu") return (
    <>
      <div className={s.chiffres}>
        <Chiffre nom="Population" v={v("pop")} f={gens} />
        <Chiffre nom="PIB" v={v("pib")} f={montant} />
        <Chiffre nom="PIB par habitant" v={v("pibHab")} f={n => `${nf(n, 0)} $`} />
        <Chiffre nom="Superficie" v={v("superficie")} f={n => `${nf(n, 0)} km²`} />
      </div>
      <h3>Carte d&apos;identité</h3>
      {p.capitale && <div className={s.ligne}><span>Capitale</span><span>{p.capitale}</span></div>}
      <div className={s.ligne}><span>Région</span><span>{p.region}</span></div>
      {p.langues && <div className={s.ligne}><span>Langues officielles</span><span>{p.langues.join(", ")}</span></div>}
      {p.monnaie && <div className={s.ligne}><span>Monnaie</span><span>{p.monnaie.join(", ")}</span></div>}
      {p.regime && <div className={s.ligne}><span>Régime</span><span>{p.regime.join(", ")}</span></div>}
      {p.enclave != null && <div className={s.ligne}><span>Accès à la mer</span><span>{p.enclave ? "Non (pays enclavé)" : "Oui"}</span></div>}
      {p.voisins && <div className={s.ligne}><span>Voisins</span><span>{p.voisins.join(", ")}</span></div>}
      {rang("pib", "PIB")}{rang("pop", "population")}
      {type && <><h3>En une phrase</h3><div className={s.type}><b>{type.titre}</b></div></>}
      <h3>Présentation</h3>
      <IntroWiki titre={p.wiki} />
    </>
  )

  if (onglet === "Économie") return (
    <>
      {type && <div className={s.type}><b>{type.titre}</b><div style={{ fontSize: 13.5, marginTop: 4 }}>Parce que {type.pourquoi.join(" ; ")}.</div></div>}
      <div className={s.chiffres}>
        <Chiffre nom="PIB" v={v("pib")} f={montant} />
        <Chiffre nom="PIB par habitant" v={v("pibHab")} f={n => `${nf(n, 0)} $`} />
        <Chiffre nom="Croissance" v={v("croissance")} f={n => pct(n)} />
        <Chiffre nom="Chômage" v={v("chomage")} f={n => pct(n)} />
      </div>
      <h3>Les trois secteurs</h3>
      <p style={{ fontSize: 13, color: "#5B6577", margin: "0 0 10px" }}>Primaire : agriculture, pêche, forêt. Secondaire : industrie, construction, énergie, mines. Tertiaire : services (commerce, banque, santé, tourisme, administration…).</p>
      <Repartition titre="Part de la richesse produite (PIB)" an={v("vaServ")?.[0]} parts={[
        { nom: "Primaire", v: v("vaAgri")?.[1], c: "#3FA34D" }, { nom: "Secondaire", v: v("vaIndus")?.[1], c: "#E08A2B" }, { nom: "Tertiaire", v: v("vaServ")?.[1], c: "#2B6BE6" },
      ]} />
      <Repartition titre="Part des emplois" an={v("empServ")?.[0]} parts={[
        { nom: "Primaire", v: v("empAgri")?.[1], c: "#3FA34D" }, { nom: "Secondaire", v: v("empIndus")?.[1], c: "#E08A2B" }, { nom: "Tertiaire", v: v("empServ")?.[1], c: "#2B6BE6" },
      ]} />
      <p style={{ fontSize: 12, color: "#8A93A3", margin: "-6px 0 10px" }}>Le reste de la richesse (jusqu&apos;à 100 %) correspond aux impôts sur les produits, comptés à part.</p>
      <Ligne nom="Dont industrie manufacturière" v={v("vaManuf")} f={n => `${pct(n)} du PIB`} />
      <Evolution titre="Croissance du PIB (% par an)" serie={d.croissance} f={n => nf(n)} />
      <Evolution titre="PIB par habitant ($)" serie={d.pibHab} f={n => nf(n / 1000, 1) + "k"} couleur="#1F5FD6" />
      <h3>Niveau de vie et inégalités</h3>
      <Ligne nom="PIB par habitant (parité de pouvoir d'achat)" v={v("pibHabPpa")} f={n => `${nf(n, 0)} $`} />
      <Ligne nom="Revenu national par habitant" v={v("rnbHab")} f={n => `${nf(n, 0)} $`} />
      <Ligne nom="Inégalités (indice de Gini, 0 = égalité)" v={v("gini")} f={n => nf(n)} />
      <Ligne nom="Population sous 2,15 $ par jour" v={v("pauvrete")} f={n => pct(n)} />
      <h3>Prix, emploi, finances publiques</h3>
      <Evolution titre="Inflation (% par an)" serie={d.inflation} f={n => nf(n)} couleur="#8B5CF6" />
      <Ligne nom="Chômage des jeunes (15-24 ans)" v={v("chomageJeunes")} f={n => pct(n)} />
      <Ligne nom="Dette de l'État" v={v("dette")} f={n => `${pct(n, 0)} du PIB`} />
      <Ligne nom="Investissements étrangers reçus (nets)" v={v("ide")} f={n => `${pct(n)} du PIB`} />
      <Ligne nom="Argent envoyé par les émigrés" v={v("transferts")} f={n => `${pct(n)} du PIB`} />
      <Ligne nom="Recherche et développement" v={v("rd")} f={n => `${pct(n, 2)} du PIB`} />
      <Ligne nom="Dépenses militaires" v={v("militaire")} f={n => `${pct(n)} du PIB`} />
      <Ligne nom="Émissions de CO₂ par habitant" v={v("co2Hab")} f={n => `${nf(n)} t`} />
      <p className={s.source}>Source : Banque mondiale. $ = dollars américains courants.</p>
    </>
  )

  if (onglet === "Commerce") {
    const ex = v("exports"), im = v("imports")
    return (
      <>
        <div className={s.chiffres}>
          <Chiffre nom="Part du PIB mondial" v={v("partPib")} f={n => pct(n, 2)} />
          <Chiffre nom="Part des exportations mondiales" v={v("partExports")} f={n => pct(n, 2)} />
          <Chiffre nom="Exportations" v={ex} f={montant} />
          <Chiffre nom="Importations" v={im} f={montant} />
        </div>
        {rang("pib", "PIB")}{rang("exports", "exportations")}
        {ex && im && ex[0] === im[0] && <div className={s.ligne}><span>Balance commerciale (biens et services)</span><span style={{ color: ex[1] >= im[1] ? "#11744A" : "#C81E3F" }}>{ex[1] >= im[1] ? "excédent de " : "déficit de "}{montant(Math.abs(ex[1] - im[1]))}<An v={ex} /></span></div>}
        <Ligne nom="Ouverture (exportations + importations)" v={v("ouverture")} f={n => `${pct(n, 0)} du PIB`} />
        <Evolution titre="Exportations (milliards $)" serie={d.exports} f={n => nf(n / 1e9, 0)} couleur="#11744A" />
        <h3>Ce que le pays exporte (marchandises)</h3>
        <Repartition titre="Composition des exportations" an={v("expManuf")?.[0]} parts={[
          { nom: "Produits manufacturés", v: v("expManuf")?.[1], c: "#2B6BE6" }, { nom: "Pétrole, gaz, charbon", v: v("expCarbu")?.[1], c: "#1a1a2e" },
          { nom: "Alimentation", v: v("expAlim")?.[1], c: "#3FA34D" }, { nom: "Minerais et métaux", v: v("expMinerais")?.[1], c: "#C8941B" },
        ]} />
        {p.orgs?.length ? <><h3>Accords et organisations économiques</h3><div className={s.pastilles}>{p.orgs.filter(o => /commerce|économique|libre-échange|Union européenne|Marché|Golfe|Asie|BRICS|Groupe des 20|G7|pétrole|Afrique/i.test(o)).map(o => <span key={o}>{o}</span>)}</div></> : null}
        <p className={s.source}>Parts mondiales calculées avec les chiffres de la Banque mondiale (même année pour le pays et le monde).</p>
      </>
    )
  }

  if (onglet === "Population") return (
    <>
      <div className={s.chiffres}>
        <Chiffre nom="Habitants" v={v("pop")} f={gens} />
        <Chiffre nom="Habitants par km²" v={v("densite")} f={n => nf(n, 0)} />
        <Chiffre nom="Espérance de vie" v={v("esperance")} f={n => `${nf(n)} ans`} />
        <Chiffre nom="Enfants par femme" v={v("fecondite")} f={n => nf(n, 2)} />
      </div>
      <Evolution titre="Population (millions)" serie={d.pop} f={n => nf(n / 1e6, 1)} couleur="#0E9F6E" />
      <Repartition titre="Âge de la population" an={v("age014")?.[0]} parts={[
        { nom: "0-14 ans", v: v("age014")?.[1], c: "#7FB3F5" }, { nom: "15-64 ans", v: v("age1564")?.[1], c: "#2B6BE6" }, { nom: "65 ans et plus", v: v("age65")?.[1], c: "#0A1628" },
      ]} />
      <Ligne nom="Croissance de la population" v={v("popCroiss")} f={n => `${pct(n, 2)} par an`} />
      <Ligne nom="Population urbaine" v={v("urbain")} f={n => pct(n, 0)} />
      <Ligne nom="Solde migratoire (arrivées − départs)" v={v("migration")} f={n => `${n > 0 ? "+" : ""}${nf(n, 0)} personnes`} />
      <Ligne nom="Mortalité infantile" v={v("mortInf")} f={n => `${nf(n)} ‰`} />
      <Ligne nom="Accès à l'électricité" v={v("electricite")} f={n => pct(n, 0)} />
      <Ligne nom="Utilisateurs d'internet" v={v("internet")} f={n => pct(n, 0)} />
      <p className={s.source}>Source : Banque mondiale.</p>
    </>
  )

  if (onglet === "Éducation") {
    const dipl = [["Au moins un diplôme du supérieur (court)", "diplSup"], ["Au moins un bachelor (licence)", "diplBachelor"], ["Au moins un master", "diplMaster"], ["Un doctorat", "diplDoctorat"]] as const
    const auMoinsUn = dipl.some(([, k]) => v(k))
    return (
      <>
        <h3>Étudiants dans l&apos;enseignement supérieur</h3>
        <Evolution titre="Nombre d'étudiants (universités, hautes écoles…)" serie={d.etudiants} f={n => (n >= 1e6 ? `${nf(n / 1e6, 2)} M` : `${nf(n / 1e3, 0)}k`)} couleur="#8B5CF6" />
        {estSerie(d.etudiants) && d.etudiants.length === 1 && <Ligne nom="Nombre d'étudiants" v={d.etudiants[0]} f={n => nf(n, 0)} />}
        <Evolution titre="Taux d'accès au supérieur (% des jeunes en âge d'y être)" serie={d.tauxSup} f={n => nf(n, 0)} couleur="#6D4ACF" />
        <Ligne nom="Taux de diplômés d'un premier diplôme (bachelor/master)" v={v("tauxDiplomes")} f={n => `${pct(n, 0)} d'une génération`} />
        <Ligne nom="Étudiants dans le privé" v={v("privePct")} f={n => pct(n, 0)} />
        <Ligne nom="Étudiants qui viennent − qui partent étudier à l'étranger" v={v("mobilite")} f={n => `${n > 0 ? "+" : ""}${nf(n, 0)}`} />
        <h3>Adultes diplômés (25 ans et plus)</h3>
        {auMoinsUn ? (
          <>
            <Evolution titre="Au moins un bachelor (% des 25 ans et plus)" serie={d.diplBachelor} f={n => nf(n)} couleur="#1F5FD6" />
            {dipl.map(([nom, k]) => <Ligne key={k} nom={nom} v={v(k)} f={n => pct(n)} />)}
          </>
        ) : <p className={s.vide}>Pas de chiffres récents pour ce pays.</p>}
        {d.filieres && (
          <>
            <h3>Dans quoi les diplômés sont formés <span className={s.an}>({d.filieres.an})</span></h3>
            {d.filieres.parts.map(([nom, x]) => (
              <div key={nom} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, margin: "4px 0" }}>
                <span style={{ flex: "0 0 48%" }}>{nom}</span>
                <span style={{ flex: 1, height: 10, background: "#EEF1F5", borderRadius: 4 }}><span style={{ display: "block", width: `${Math.min(100, x * 2.5)}%`, height: "100%", background: "#8B5CF6", borderRadius: 4 }} /></span>
                <b style={{ width: 52, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{nf(x)} %</b>
              </div>
            ))}
          </>
        )}
        <h3>Système éducatif</h3>
        <Ligne nom="Dépenses d'éducation" v={v("depEduc")} f={n => `${pct(n)} du PIB`} />
        <Ligne nom="Taux de scolarisation au secondaire" v={v("tauxSecondaire")} f={n => pct(n, 0)} />
        <Ligne nom="Adultes sachant lire et écrire" v={v("alphab")} f={n => pct(n, 0)} />
        <p className={s.source}>Sources : UNESCO (Institut de statistique) et Banque mondiale. Le nombre exact de diplômes délivrés chaque année n&apos;est pas publié en libre accès ; on montre le nombre d&apos;étudiants et la part des diplômés.</p>
      </>
    )
  }

  if (onglet === "Politique") return (
    <>
      {p.regime && <div className={s.ligne}><span>Régime</span><span>{p.regime.join(", ")}</span></div>}
      {p.fonctionEtat && <div className={s.ligne}><span>Chef de l&apos;État</span><span>{p.fonctionEtat}</span></div>}
      {p.fonctionGouv && <div className={s.ligne}><span>Chef du gouvernement</span><span>{p.fonctionGouv}</span></div>}
      {p.creation && <div className={s.ligne}><span>Création de l&apos;État actuel</span><span>{p.creation < 0 ? `${-p.creation} av. J.-C.` : p.creation}</span></div>}
      {p.orgs?.length ? <><h3>Membre de</h3><div className={s.pastilles}>{p.orgs.map(o => <span key={o}>{o}</span>)}</div></> : null}
      <h3>La vie politique (Wikipédia)</h3>
      <TexteWiki titre={p.wiki} sections={/politi|institution|gouvernement|régime|administration|subdivisions|relations internationales|défense/i} ouvrirTout />
      <p className={s.source}>Régime et organisations : Wikidata. Le nom des dirigeants actuels est dans le texte de Wikipédia.</p>
    </>
  )

  return <TexteWiki titre={p.wikiHistoire || p.wiki} sections={p.wikiHistoire ? undefined : /histoire/i} />
}

// Introduction seule de l'article principal (onglet Aperçu)
function IntroWiki({ titre }: { titre?: string }) {
  const [a, setA] = useState<{ pour?: string; intro?: string[] }>({})
  useEffect(() => {
    if (!titre) return
    let actif = true
    chargerArticle(titre).then(x => { if (actif) setA({ pour: titre, intro: x.intro }) }).catch(() => { if (actif) setA({ pour: titre, intro: [] }) })
    return () => { actif = false }
  }, [titre])
  if (!titre || a.pour !== titre || !a.intro?.length) return null
  return <div className={s.wiki}>{a.intro.slice(0, 4).map((p, i) => <p key={i}>{p}</p>)}<p className={s.source}>Texte : Wikipédia (CC BY-SA).</p></div>
}

// ─── Couleurs de la carte ───
const MODES = [
  { id: "aucun", nom: "Régions" },
  { id: "pibHab", nom: "Richesse par habitant", f: (n: number) => `${nf(n / 1000, 0)}k $`, log: true },
  { id: "pop", nom: "Population", f: gens, log: true },
  { id: "partExports", nom: "Part du commerce mondial", f: (n: number) => pct(n, 2), log: true },
  { id: "vaServ", nom: "Part des services", f: (n: number) => pct(n, 0) },
  { id: "diplBachelor", nom: "Adultes diplômés (bachelor)", f: (n: number) => pct(n, 0) },
] as const
const RAMPE = ["#DCE8F7", "#B3CDEE", "#83ADE2", "#4F87D2", "#2861B5", "#14408A"]
const COULEUR_REGION: Record<string, string> = {
  "Europe et Asie centrale": "#B9CDE5", "Asie de l'Est et Pacifique": "#C9DDBE", "Amérique latine et Caraïbes": "#E9D3B4", "Moyen-Orient et Afrique du Nord": "#E5C9A6",
  "Amérique du Nord": "#C8C3E2", "Asie du Sud": "#D8E2B0", "Afrique subsaharienne": "#E9C8C0",
}

export default function Atlas({ onFermer }: { onFermer: () => void }) {
  const [carte, setCarte] = useState<Carte | null>(null)
  const [donnees, setDonnees] = useState<Donnees | null>(null)
  const [erreur, setErreur] = useState(false)
  const [choisi, setChoisi] = useState<string | null>(null)
  const [onglet, setOnglet] = useState<Onglet>("Aperçu")
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("aucun")
  const [vue, setVue] = useState({ x: 0, y: 0, k: 1 })
  const [survol, setSurvol] = useState<{ n: string; x: number; y: number } | null>(null)
  const [recherche, setRecherche] = useState("")
  const [grand, setGrand] = useState(false)
  // Globe 3D par défaut (avec réseau et WebGL), sinon la carte plate qui marche partout
  const [globe, setGlobe] = useState(() => navigator.onLine && webglPossible())
  const [fond, setFond] = useState<"plan" | "satellite">("plan")
  const [centrerGlobe, setCentrerGlobe] = useState<{ iso: string; n: number } | null>(null)
  const zone = useRef<HTMLDivElement>(null)
  const pointeurs = useRef(new Map<number, { x: number; y: number }>())
  const geste = useRef<{ depart: { x: number; y: number }; bouge: boolean; dist?: number; vue: typeof vue } | null>(null)

  useEffect(() => {
    Promise.all([fetch("/atlas/carte.json").then(r => r.json()), fetch("/atlas/pays.json").then(r => r.json())])
      .then(([c, d]) => { setCarte(c); setDonnees(d) }).catch(() => setErreur(true))
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") onFermer() }
    window.addEventListener("keydown", echap)
    return () => window.removeEventListener("keydown", echap)
  }, [onFermer])

  // Couleur de chaque pays selon le mode choisi (classes par quantiles)
  const couleurs = useMemo(() => {
    const res: Record<string, string> = {}
    if (!carte || !donnees) return { res, seuils: [] as number[] }
    if (mode === "aucun") { for (const f of carte.pays) res[f.iso] = COULEUR_REGION[donnees.pays[f.iso]?.region] || "#D5DBE3"; return { res, seuils: [] as number[] } }
    const vals = carte.pays.map(f => [f.iso, dernier(donnees.pays[f.iso]?.d[mode])?.[1]] as const).filter((x): x is readonly [string, number] => x[1] != null)
    const tri = vals.map(x => x[1]).sort((a, b) => a - b)
    const seuils = [1, 2, 3, 4, 5].map(i => tri[Math.floor((i * tri.length) / 6)])
    for (const [iso, x] of vals) res[iso] = RAMPE[seuils.filter(t => x >= t).length]
    for (const f of carte.pays) res[f.iso] ||= "#E3E6EA"
    return { res, seuils }
  }, [carte, donnees, mode])

  // ─── Déplacer et zoomer ───
  function versCarte(clientX: number, clientY: number) {
    const r = zone.current!.getBoundingClientRect()
    return { x: ((clientX - r.left) / r.width) * (carte?.w ?? 1000), y: ((clientY - r.top) / r.height) * (carte?.h ?? 520) }
  }
  function zoomer(facteur: number, cx?: number, cy?: number) {
    setVue(v => {
      const k = Math.min(40, Math.max(1, v.k * facteur))
      const px = cx ?? (carte?.w ?? 1000) / 2, py = cy ?? (carte?.h ?? 520) / 2
      // le point sous le doigt reste au même endroit
      return k === 1 ? { x: 0, y: 0, k } : { k, x: px - ((px - v.x) * k) / v.k, y: py - ((py - v.y) * k) / v.k }
    })
  }
  function bas(e: React.PointerEvent) {
    zone.current!.setPointerCapture(e.pointerId)
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = [...pointeurs.current.values()]
    geste.current = { depart: { x: e.clientX, y: e.clientY }, bouge: pts.length > 1, vue, dist: pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : undefined }
  }
  function deplacer(e: React.PointerEvent) {
    if (!pointeurs.current.has(e.pointerId)) {
      if (e.pointerType === "mouse" && carte) {
        const iso = (e.target as Element).getAttribute?.("data-iso")
        const r = zone.current!.getBoundingClientRect()
        setSurvol(iso ? { n: donnees?.pays[iso]?.nom || carte.pays.find(f => f.iso === iso)?.n || iso, x: e.clientX - r.left, y: e.clientY - r.top } : null)
      }
      return
    }
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = geste.current; if (!g) return
    const pts = [...pointeurs.current.values()]
    const r = zone.current!.getBoundingClientRect(), echelle = (carte?.w ?? 1000) / r.width
    if (pts.length === 2 && g.dist) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const m = versCarte((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2)
      const k = Math.min(40, Math.max(1, (g.vue.k * dist) / g.dist))
      setVue({ k, x: m.x - ((m.x - g.vue.x) * k) / g.vue.k, y: m.y - ((m.y - g.vue.y) * k) / g.vue.k })
      g.bouge = true
      return
    }
    const dx = e.clientX - g.depart.x, dy = e.clientY - g.depart.y
    if (Math.hypot(dx, dy) > 6) g.bouge = true
    if (g.bouge) setVue({ ...g.vue, x: g.vue.x + dx * echelle, y: g.vue.y + dy * echelle })
  }
  function haut(e: React.PointerEvent) {
    const g = geste.current
    pointeurs.current.delete(e.pointerId)
    if (pointeurs.current.size) { const [p] = pointeurs.current.values(); geste.current = { depart: p, bouge: true, vue } ; return }
    geste.current = null
    if (g && !g.bouge) {
      const iso = (document.elementFromPoint(e.clientX, e.clientY) as Element | null)?.getAttribute("data-iso")
      if (iso) choisir(iso)
    }
  }
  function choisir(iso: string, centrer = false) {
    setChoisi(iso); setRecherche(""); setSurvol(null)
    if (centrer && globe) setCentrerGlobe({ iso, n: Date.now() })
    else if (centrer && carte) {
      const f = carte.pays.find(x => x.iso === iso)
      if (f) { const k = 4; setVue({ k, x: carte.w / 2 - f.c[0] * k, y: carte.h / 2 - f.c[1] * k }) }
    }
  }

  const suggestions = useMemo(() => {
    if (!carte || !recherche.trim()) return []
    const q = recherche.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
    return carte.pays.map(f => ({ iso: f.iso, nom: donnees?.pays[f.iso]?.nom || f.n }))
      .filter(x => x.nom.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").includes(q)).sort((a, b) => a.nom.localeCompare(b.nom, "fr")).slice(0, 8)
  }, [carte, donnees, recherche])

  const p = choisi ? donnees?.pays[choisi] : undefined
  const nomChoisi = choisi ? p?.nom || carte?.pays.find(f => f.iso === choisi)?.n : ""
  const modeInfo = MODES.find(m => m.id === mode)!

  return (
    <div className={s.atlas} role="dialog" aria-modal="true" aria-label="Atlas du monde">
      <div className={s.barre}>
        <button className={s.bouton} onClick={onFermer} aria-label="Fermer l'atlas">←</button>
        <h1>Atlas du monde</h1>
        <div className={s.recherche}>
          <input type="search" placeholder="Chercher un pays…" value={recherche} onChange={e => setRecherche(e.target.value)} aria-label="Chercher un pays"
            onKeyDown={e => { if (e.key === "Enter" && suggestions[0]) choisir(suggestions[0].iso, true) }} />
          {suggestions.length > 0 && (
            <div className={s.suggestions}>
              {suggestions.map(x => <button key={x.iso} onClick={() => choisir(x.iso, true)}>{drapeau(donnees?.pays[x.iso]?.i2)} {x.nom}</button>)}
            </div>
          )}
        </div>
      </div>

      <div className={s.corps}>
        <div ref={zone} className={s.carte} {...(globe ? { style: { cursor: "default", touchAction: "auto" } } : {
          onPointerDown: bas, onPointerMove: deplacer, onPointerUp: haut, onPointerCancel: haut,
          onPointerLeave: () => setSurvol(null),
          onWheel: (e: React.WheelEvent) => { const m = versCarte(e.clientX, e.clientY); zoomer(e.deltaY < 0 ? 1.25 : 0.8, m.x, m.y) },
          onDoubleClick: (e: React.MouseEvent) => { const m = versCarte(e.clientX, e.clientY); zoomer(2, m.x, m.y) },
        })}>
          {globe ? (
            <GlobeCarte couleurs={mode === "aucun" ? null : couleurs.res} choisi={choisi} centrer={centrerGlobe} fond={fond}
              onChoisir={iso => choisir(iso)} onErreur={() => setGlobe(false)} />
          ) : erreur ? <p className={s.vide} style={{ padding: 20 }}>La carte n&apos;a pas pu être chargée. Vérifie ta connexion.</p>
            : !carte ? <div className="nx-skel" style={{ position: "absolute", inset: 16, borderRadius: 16 }} />
              : (
                <svg viewBox={`0 0 ${carte.w} ${carte.h}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Carte du monde : touche un pays pour voir sa fiche">
                  <g transform={`translate(${vue.x} ${vue.y}) scale(${vue.k})`}>
                    {carte.pays.map(f => (
                      <path key={f.iso} d={f.d} data-iso={f.iso} className={`${s.pays} ${f.iso === choisi ? s.choisi : ""}`}
                        style={{ fill: f.iso === choisi ? "#F2C94C" : couleurs.res[f.iso], strokeWidth: (f.iso === choisi ? 1.6 : 0.4) / vue.k }} />
                    ))}
                  </g>
                </svg>
              )}
          <div className={s.couleurs} role="group" aria-label="Colorer la carte selon">
            {MODES.map(m => <button key={m.id} aria-pressed={mode === m.id} onClick={() => setMode(m.id)} onPointerDown={e => e.stopPropagation()}>{m.nom}</button>)}
          </div>
          <div className={s.outils} onPointerDown={e => e.stopPropagation()}>
            <button onClick={() => setGlobe(g => !g)} aria-label={globe ? "Passer à la carte plate" : "Passer au globe 3D"} title={globe ? "Carte plate" : "Globe 3D"}>{globe ? "🗺️" : "🌍"}</button>
            {globe ? (
              <button onClick={() => setFond(f => (f === "plan" ? "satellite" : "plan"))} aria-label={fond === "plan" ? "Vue satellite" : "Vue plan"} title={fond === "plan" ? "Satellite" : "Plan"}>{fond === "plan" ? "🛰️" : "🧭"}</button>
            ) : (
              <>
                <button onClick={() => zoomer(1.6)} aria-label="Zoomer">+</button>
                <button onClick={() => zoomer(1 / 1.6)} aria-label="Dézoomer">−</button>
                <button onClick={() => setVue({ x: 0, y: 0, k: 1 })} aria-label="Voir le monde entier">⤢</button>
              </>
            )}
          </div>
          {mode !== "aucun" && couleurs.seuils.length > 0 && "f" in modeInfo && (
            <div className={s.legende} aria-label={`Légende : ${modeInfo.nom}`} style={globe ? { bottom: 44 } : undefined}>
              <b>{modeInfo.nom}</b>
              <div className={s.echelle}>{RAMPE.map(c => <span key={c} style={{ background: c }} />)}</div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 2 }}><span>moins</span><span>plus de {modeInfo.f(couleurs.seuils[4])}</span></div>
            </div>
          )}
          {survol && <div className={s.bulle} style={{ left: survol.x, top: survol.y }}>{survol.n}</div>}
          {!choisi && carte && <div className={s.aide}>{globe ? "Fais tourner le globe, pince pour zoomer jusqu'aux rues, touche un pays" : "Glisse pour te déplacer, pince ou molette pour zoomer, touche un pays"}</div>}
        </div>

        {choisi && (
          <aside className={`${s.panneau} ${grand ? s.grand : ""}`} aria-label={`Fiche : ${nomChoisi}`}>
            <button className={s.poignee} onClick={() => setGrand(g => !g)} aria-label={grand ? "Réduire la fiche" : "Agrandir la fiche"}><span /></button>
            <div className={s.tete}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <h2 style={{ flex: 1 }}><span aria-hidden="true">{drapeau(p?.i2)}</span>{nomChoisi}</h2>
                <button onClick={() => setChoisi(null)} aria-label="Fermer la fiche" style={{ minWidth: 40, minHeight: 40, borderRadius: 999, border: "1px solid #D6DCE6", background: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>
              <div className={s.sousTitre}>{p ? [p.capitale, p.region, p.revenu && `pays à ${p.revenu}`].filter(Boolean).join(" · ") : "Territoire sans statistiques de la Banque mondiale"}</div>
            </div>
            {p && (
              <div className={s.onglets} role="tablist">
                {ONGLETS.map(o => <button key={o} role="tab" aria-selected={onglet === o} onClick={() => setOnglet(o)}>{o}</button>)}
              </div>
            )}
            <div className={s.contenu} role="tabpanel">
              {p ? <Fiche p={p} onglet={onglet} /> : <TexteWiki titre={nomChoisi || undefined} />}
              {p && <p className={s.source}>Chiffres : {donnees?.sources}. Mise à jour {donnees?.maj}. L&apos;année de chaque chiffre est indiquée entre parenthèses.</p>}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
