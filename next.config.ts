import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
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
