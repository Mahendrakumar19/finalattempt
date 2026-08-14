import type { NextConfig } from "next";

const BACKEND_ORIGIN = process.env.BACKEND_PROXY_TARGET || 'http://38.242.244.225:5000';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '38.242.244.225',
    '38.242.244.225:3000',
    'finalattemptias.com',
    'www.finalattemptias.com',
    'localhost',
    'localhost:3000'
  ],
  async redirects() {
    return [];
  },
  async rewrites() {
    return [
      // Proxy all API routes through Next.js → backend
      {
        source: '/api/:path*',
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
      // Proxy all uploaded file requests through Next.js → backend
      {
        source: '/uploads/:path*',
        destination: `${BACKEND_ORIGIN}/uploads/:path*`,
      },
      // Also proxy the /api/files/:filename route used by the uploads module
      {
        source: '/api/files/:filename*',
        destination: `${BACKEND_ORIGIN}/api/files/:filename*`,
      },
      // Route legacy /page/:slug URLs to the /p/:slug dynamic page handler
      {
        source: '/page/:slug*',
        destination: '/p/:slug*',
      },
    ];
  },
};

export default nextConfig;
