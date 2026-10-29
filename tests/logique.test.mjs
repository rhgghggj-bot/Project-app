// Tests de la logique pure : calculatrice et points du jeu « Esprit ».
// Lancer avec : npm test
import { test } from "node:test"
import assert from "node:assert/strict"
import { calculer, ecrireNombre } from "../lib/calcul.ts"
import { bonusSerie, finirPartie, JEU_VIDE, niveau, pointsCalib, pointsFermi, pointsManip, serieJours, tirer, tirerDuJour, jourISO } from "../lib/espritJeu.ts"

const proche = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b))

test("calculatrice : priorités, parenthèses, puissances", () => {
  for (const [e, v] of [["2+3×4", 14], ["(2+3)×4", 20], ["-2^2", -4], ["2^3^2", 512], ["10÷4", 2.5], ["3,5×2", 7], ["2^-1", 0.5], ["-3+-2", -5]]) assert.ok(proche(calculer(e), v), e)
})
test("calculatrice : fonctions, constantes, multiplication sous-entendue", () => {
  for (const [e, v, deg] of [["2π", 2 * Math.PI], ["3(4+1)", 15], ["√9", 3], ["2√9", 6], ["5²", 25], ["50%", 0.5], ["sin(30)", 0.5], ["cos 60", 0.5], ["tan(45)", 1], ["sin(180)", 0], ["log(1000)", 3], ["ln(e)", 1], ["1,5E3", 1500], ["asin(0.5)", 30], ["sin(π/2)", 1, false], ["(1+2)(3)", 9]]) assert.ok(proche(calculer(e, deg ?? true), v), e)
})
test("calculatrice : parenthèse oubliée à la fin tolérée, erreurs refusées", () => {
  assert.equal(calculer("2×(3+4"), 14)
  for (const e of ["2+", "abc", "()", "3)", ""]) assert.throws(() => calculer(e), e)
})
test("calculatrice : affichage du résultat", () => {
  assert.equal(ecrireNombre(0.1 + 0.2), "0,3")
  assert.equal(ecrireNombre(6.02e23), "6,02E23")
  assert.equal(ecrireNombre(1 / 0), "Erreur")
  assert.ok(proche(calculer(ecrireNombre(1 / 3)), 1 / 3 + 0) || calculer(ecrireNombre(1 / 3)) > 0.3333)
})

test("Esprit : points Fermi selon l'écart et les indices", () => {
  assert.equal(pointsFermi(100, 100, 0), 100)
  assert.equal(pointsFermi(180, 100, 0), 80)
  assert.equal(pointsFermi(1000, 100, 0), 20)
  assert.equal(pointsFermi(10000, 100, 0), 0)
  assert.equal(pointsFermi(100, 100, 2), 80)
})
test("Esprit : le score de calibration récompense l'honnêteté", () => {
  assert.equal(pointsCalib(1, true), 100)
  assert.equal(pointsCalib(1, false), 0)
  assert.equal(pointsCalib(0.5, true), 75)
  assert.equal(pointsCalib(0.5, false), 75)
  // En moyenne, dire 70 % quand on a raison 7 fois sur 10 rapporte plus que dire 100 %
  const moyenne = c => 0.7 * pointsCalib(c, true) + 0.3 * pointsCalib(c, false)
  assert.ok(moyenne(0.7) > moyenne(1))
})
test("Esprit : manipulation, série, niveaux", () => {
  assert.equal(pointsManip(false, 1), 0)
  assert.equal(pointsManip(true, 1), 100)
  assert.equal(pointsManip(true, 0), 50)
  assert.equal(bonusSerie(1), 1)
  assert.ok(proche(bonusSerie(3), 1.2))
  assert.equal(bonusSerie(20), 1.5)
  assert.equal(niveau(0).n, 1)
  assert.equal(niveau(150).n, 2)
  assert.equal(niveau(600).n, 3)
})
test("Esprit : tirage sans doublon, ce qu'on n'a jamais vu passe d'abord", () => {
  const liste = Array.from({ length: 30 }, (_, i) => ({ id: "q" + i }))
  const vus = Object.fromEntries(liste.slice(0, 25).map(x => [x.id, Date.now()]))
  const t = tirer(liste, vus, 5)
  assert.equal(new Set(t.map(x => x.id)).size, 5)
  assert.deepEqual(t.map(x => x.id).sort(), ["q25", "q26", "q27", "q28", "q29"])
})
test("Esprit : le défi du jour est le même pour tout le monde", () => {
  const liste = Array.from({ length: 50 }, (_, i) => ({ id: "q" + i }))
  assert.deepEqual(tirerDuJour(liste, 5, "proba", "2026-10-29"), tirerDuJour(liste, 5, "proba", "2026-10-29"))
  assert.notDeepEqual(tirerDuJour(liste, 5, "proba", "2026-10-29"), tirerDuJour(liste, 5, "proba", "2026-10-30"))
})
test("Esprit : fin de partie (record, XP, défi du jour, série de jours)", () => {
  const r1 = finirPartie(JEU_VIDE, "proba", 700, 1000, ["a1"], [[0.7, 1]])
  assert.equal(r1.record, true)
  assert.equal(r1.jeu.records.proba, 700)
  assert.equal(r1.jeu.xp, 70)
  const r2 = finirPartie(r1.jeu, "proba", 500, 1000, ["a2"], [])
  assert.equal(r2.record, false)
  assert.equal(r2.jeu.records.proba, 700)
  const r3 = finirPartie(r2.jeu, "jour", 400, 1000, [], [])
  assert.equal(r3.jeu.duJour?.score, 400)
  assert.equal(finirPartie(r3.jeu, "jour", 900, 1000, [], []).jeu.duJour?.score, 400)   // seul le premier essai compte
  assert.equal(serieJours([jourISO()]), 1)
})
