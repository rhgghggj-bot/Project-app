import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }]
    }
  ],
  experimental: {
    // Transitions animées entre les pages (<ViewTransition> dans PageFrame)
    viewTransition: true,
  },
};

export default nextConfig;
