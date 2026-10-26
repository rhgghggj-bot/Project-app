"use client"
import { useEffect, useRef, useState } from "react"
import * as maplibregl from "maplibre-gl"
import type { MapGeoJSONFeature } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

// Globe 3D de l'atlas (MapLibre) : on le fait tourner au doigt, on zoome
// jusqu'aux villes et aux rues. Fond « Plan » : OpenStreetMap (OpenFreeMap,
// gratuit, sans clé) ; fond « Satellite » : Sentinel-2 sans nuages (EOX).
// Les pays sont une couche par-dessus : colorés selon le mode choisi et
// cliquables pour ouvrir leur fiche.

type Props = {
  couleurs: Record<string, string> | null      // null = pas de coloriage (fond seul)
  choisi: string | null
  centrer: { iso: string; n: number } | null     // change → le globe va sur ce pays
  fond: "plan" | "satellite"
  onChoisir: (iso: string) => void
  onErreur: () => void
  depart?: [number, number]                      // [longitude, latitude] du premier cadrage
}

type Geo = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, { iso: string }>

const STYLE = "https://tiles.openfreemap.org/styles/liberty"
const SATELLITE = "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg"

// Cadre d'un pays pour centrer le globe dessus
function cadre(f: Geo["features"][number]): [[number, number], [number, number]] {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates
  const bornes = (p: number[][][]) => {
    let o = 180, s = 90, e = -180, n = -90
    for (const [x, y] of p[0]) { o = Math.min(o, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y) }
    return { o, s, e, n, aire: (e - o) * (n - s) }
  }
  const tous = polys.map(bornes)
  let b = tous.reduce((a, x) => ({ o: Math.min(a.o, x.o), s: Math.min(a.s, x.s), e: Math.max(a.e, x.e), n: Math.max(a.n, x.n), aire: 0 }))
  // Territoires lointains (France et outre-mer, États-Unis et Alaska…) : on vise le plus grand morceau
  if (b.e - b.o > 40 || b.n - b.s > 40) b = tous.sort((x, y) => y.aire - x.aire)[0]
  return [[b.o, b.s], [b.e, b.n]]
}

export default function GlobeCarte({ couleurs, choisi, centrer, fond, onChoisir, onErreur, depart }: Props) {
  const conteneur = useRef<HTMLDivElement>(null)
  const carte = useRef<maplibregl.Map | null>(null)
  const geo = useRef<Geo | null>(null)
  const [pret, setPret] = useState(false)
  const rappels = useRef({ onChoisir, onErreur })
  const departRef = useRef(depart)
  useEffect(() => { rappels.current = { onChoisir, onErreur } })

  // Création du globe (une seule fois)
  useEffect(() => {
    maplibregl.setWorkerUrl("/atlas/maplibre-gl-worker.mjs")
    const map = new maplibregl.Map({
      container: conteneur.current!, style: STYLE, center: departRef.current ?? [8, 30], zoom: departRef.current ? 2 : 1.4, attributionControl: { compact: true },
      maxPitch: 60, renderWorldCopies: false,
    })
    carte.current = map
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right")
    let echecs = 0
    // Réseau qui ne répond pas (wifi sans internet…) : carte plate au bout de 8 s
    const delai = setTimeout(() => { if (!map.isStyleLoaded()) rappels.current.onErreur() }, 8000)
    map.on("error", () => { if (++echecs === 1 && !map.isStyleLoaded()) rappels.current.onErreur() })
    map.on("style.load", async () => {
      clearTimeout(delai)
      map.setProjection({ type: "globe" })
      // Noms en français quand ils existent
      for (const l of map.getStyle().layers) {
        if (l.type === "symbol" && map.getLayoutProperty(l.id, "text-field")) {
          map.setLayoutProperty(l.id, "text-field", ["coalesce", ["get", "name:fr"], ["get", "name_int"], ["get", "name"]])
        }
      }
      const premierTexte = map.getStyle().layers.find(l => l.type === "symbol")?.id
      map.addSource("satellite", { type: "raster", tiles: [SATELLITE], tileSize: 256, maxzoom: 15, attribution: "Sentinel-2 cloudless 2020 © EOX (Copernicus)" })
      map.addLayer({ id: "satellite", type: "raster", source: "satellite", layout: { visibility: "none" } }, premierTexte)
      try {
        const g: Geo = await (await fetch("/atlas/pays.geojson")).json()
        geo.current = g
        map.addSource("pays", { type: "geojson", data: g, promoteId: "iso" })
        map.addLayer({ id: "pays-couleur", type: "fill", source: "pays", paint: { "fill-color": "#000", "fill-opacity": 0 } }, premierTexte)
        map.addLayer({ id: "pays-choisi", type: "line", source: "pays", filter: ["==", ["get", "iso"], ""], paint: { "line-color": "#F2B705", "line-width": 3 } })
        setPret(true)
      } catch { /* sans la couche des pays, le globe reste utilisable */ }
    })
    map.on("click", "pays-couleur", e => {
      const f = e.features?.[0] as MapGeoJSONFeature | undefined
      const iso = f?.properties?.iso
      if (iso) rappels.current.onChoisir(String(iso))
    })
    map.on("mouseenter", "pays-couleur", () => { map.getCanvas().style.cursor = "pointer" })
    map.on("mouseleave", "pays-couleur", () => { map.getCanvas().style.cursor = "" })
    return () => { clearTimeout(delai); map.remove(); carte.current = null }
  }, [])

  // Couleurs des pays selon le mode
  useEffect(() => {
    const map = carte.current
    if (!map || !pret) return
    if (!couleurs) { map.setPaintProperty("pays-couleur", "fill-opacity", 0); return }
    const expr: unknown[] = ["match", ["get", "iso"]]
    for (const [iso, c] of Object.entries(couleurs)) expr.push(iso, c)
    expr.push("#E3E6EA")
    map.setPaintProperty("pays-couleur", "fill-color", expr as maplibregl.ExpressionSpecification)
    map.setPaintProperty("pays-couleur", "fill-opacity", ["interpolate", ["linear"], ["zoom"], 2, 0.75, 6, 0.35, 9, 0])
  }, [couleurs, pret])

  // Pays choisi : contour doré
  useEffect(() => {
    const map = carte.current
    if (!map || !pret) return
    map.setFilter("pays-choisi", ["==", ["get", "iso"], choisi ?? ""])
  }, [choisi, pret])

  // Aller sur un pays (recherche)
  useEffect(() => {
    const map = carte.current
    if (!map || !pret || !centrer) return
    const f = geo.current?.features.find(x => x.properties.iso === centrer.iso)
    if (f) map.fitBounds(cadre(f), { padding: 60, maxZoom: 5.5, duration: 1600 })
  }, [centrer, pret])

  // Fond plan ou satellite
  useEffect(() => {
    const map = carte.current
    if (!map || !pret) return
    map.setLayoutProperty("satellite", "visibility", fond === "satellite" ? "visible" : "none")
  }, [fond, pret])

  return <div ref={conteneur} style={{ position: "absolute", inset: 0 }} aria-label="Globe : fais-le tourner au doigt, pince pour zoomer, touche un pays" role="application" />
}

