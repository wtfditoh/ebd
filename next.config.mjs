/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ebd-pro/database'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
