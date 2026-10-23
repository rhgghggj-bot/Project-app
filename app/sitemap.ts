import type { MetadataRoute } from "next"
import { LEGAL } from "@/lib/legal"

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number, MetadataRoute.Sitemap[number]["changeFrequency"]][] = [
    ["/presentation", 1, "weekly"],
    ["/inscription", 0.8, "monthly"],
    ["/connexion", 0.5, "monthly"],
    ["/confidentialite", 0.3, "yearly"],
    ["/cgu", 0.3, "yearly"],
  ]
  return pages.map(([chemin, priority, changeFrequency]) => ({ url: LEGAL.site + chemin, lastModified: new Date("2026-10-23"), changeFrequency, priority }))
}
