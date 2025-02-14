/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Server-side: Erlaube native Module
    if (isServer) {
      config.externals = [...config.externals, 'better-sqlite3'];
    }
    return config;
  }
}

module.exports = nextConfig
