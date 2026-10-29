// Tests du contenu : identifiants uniques, réponses cohérentes, liens YouTube bien formés.
// Ils évitent qu'un ajout de chanson, de chapitre ou de continent casse l'appli.
import { test } from "node:test"
import assert from "node:assert/strict"
import { CHANSONS, ALBUMS } from "../lib/musique.ts"
import { CHAPITRES } from "../lib/renaissance.ts"
import { CONTINENTS, NOTIONS } from "../lib/biodiversite.ts"

const uniques = (liste, nom) => { const vus = new Set(); for (const x of liste) { assert.ok(!vus.has(x), `${nom} en double : ${x}`); vus.add(x) } }
const quizOk = (q, ou) => { assert.ok(q.bonne >= 0 && q.bonne < (q.choix ?? q.options).length, `bonne réponse hors des choix : ${ou}`) }

test("musique : chansons", () => {
  uniques(CHANSONS.map(c => c.id), "chanson")
  for (const c of CHANSONS) {
    assert.match(c.id, /^[\w-]{11}$/, `identifiant YouTube invalide : ${c.titre}`)
    assert.ok(c.mots.length > 0 && c.quiz.length > 0, `fiche incomplète : ${c.titre}`)
    const decennie = c.annee < 2000 ? `${String(c.annee)[2]}0s` : `${Math.floor(c.annee / 10) * 10}s`
    assert.equal(c.decennie, decennie, `décennie incohérente : ${c.titre}`)
    c.quiz.forEach(q => quizOk(q, c.titre))
  }
})
test("musique : albums", () => {
  uniques(ALBUMS.map(a => a.id), "album")
  for (const a of ALBUMS) {
    assert.match(a.vignette, /^[\w-]{11}$/, `vignette invalide : ${a.titre}`)
    for (const v of a.videos ?? []) assert.match(v, /^[\w-]{11}$/, `clip invalide dans ${a.titre}`)
    if (!a.videos) assert.match(a.id, /^(OLAK5uy_|PL)[\w-]+$/, `album sans clips ni playlist : ${a.titre}`)
    a.quiz.forEach(q => quizOk(q, a.titre))
  }
})
test("Projet Graine : chapitres et défis", () => {
  uniques(CHAPITRES.map(c => c.id), "chapitre")
  CHAPITRES.forEach((c, i) => assert.equal(c.numero, i + 1, `numéro de chapitre : ${c.id}`))
  for (const c of CHAPITRES) {
    assert.ok(c.recit.length && c.science.length && c.defis.length, `chapitre incomplet : ${c.id}`)
    for (const d of c.defis) {
      assert.ok(d.solution.length > 0, `défi sans solution : ${c.id}`)
      if (d.type === "nombre") assert.ok(Number.isFinite(d.reponse) && d.tolerance >= 0 && d.tolerance < 0.5, `défi mal réglé : ${c.id}`)
      else quizOk(d, c.id)
    }
  }
})
test("biodiversité : continents", () => {
  assert.ok(NOTIONS.length > 0)
  uniques(CONTINENTS.map(c => c.id), "continent")
  uniques(CONTINENTS.flatMap(c => c.pays), "pays")
  for (const c of CONTINENTS) {
    for (const iso of c.pays) assert.match(iso, /^[A-Z]{3}$/, `code pays invalide : ${iso}`)
    c.quiz.forEach(q => quizOk({ ...q, choix: q.options }, c.nom))
  }
})
