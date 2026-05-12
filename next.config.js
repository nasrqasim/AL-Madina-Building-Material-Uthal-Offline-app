/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
}

// Trigger reload to fix asset 404s
module.exports = nextConfig