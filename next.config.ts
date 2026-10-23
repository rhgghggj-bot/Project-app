import type { NextConfig } from "next";

// En-têtes de sécurité pour toutes les pages. HSTS : le navigateur passe
// toujours en HTTPS (Vercel redirige déjà http → https).
const securite = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Caméra (scanner, appels) et micro (appels) pour Nexia seulement
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), browsing-topics=()' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers: async () => [
    { source: '/:path*', headers: securite },
    {
      // Pages et API toujours à jour, mais les fichiers statiques (_next/static,
      // images, icônes, polices, livres) restent dans le cache du navigateur
      source: '/((?!_next/static|_next/image|bibliotheque/|programmes/|pdfjs/|.*\\.(?:png|svg|jpg|jpeg|webp|ico|woff2?)$).*)',
      headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }]
    }
  ],
  experimental: {
    // Transitions animées entre les pages (<ViewTransition> dans PageFrame)
    viewTransition: true,
  },
};

export default nextConfig;
