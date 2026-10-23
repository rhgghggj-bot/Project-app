import type { MetadataRoute } from "next"
import { LEGAL } from "@/lib/legal"

// Seules les pages publiques sont à référencer ; le reste demande un compte
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/presentation", "/connexion", "/inscription", "/confidentialite", "/cgu"], disallow: ["/api/", "/"] },
    sitemap: `${LEGAL.site}/sitemap.xml`,
  }
}
