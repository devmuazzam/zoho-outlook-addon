/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'ngrok-skip-browser-warning',
            value: 'any',
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.office.com https://*.office365.com https://*.sharepoint.com https://*.outlook.com https://outlook.live.com https://*.pinggy.link https://*.ngrok.io https://*.ngrok-free.app *;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;