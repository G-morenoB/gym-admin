import type { NextConfig } from 'next'
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(admin|recepcion)/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        { key: 'Pragma', value: 'no-cache' },
      ],
    },
  ],
}

module.exports = withPWA(nextConfig)