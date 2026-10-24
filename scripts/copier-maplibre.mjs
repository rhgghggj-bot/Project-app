// Le globe de l'atlas (MapLibre 6) charge son « worker » depuis un fichier à
// part, que Next ne copie pas : on le met dans public/ avant chaque build.
import { copyFileSync, mkdirSync } from "fs"
mkdirSync("public/atlas", { recursive: true })
copyFileSync("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", "public/atlas/maplibre-gl-worker.mjs")
