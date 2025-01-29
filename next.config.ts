import type { NextConfig } from 'next'

const config: NextConfig = {
  // Turbopack is now enabled by default in Next.js 15 development
  // No need for experimental flag anymore
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        'pdf-parse': false
      }
    }
    return config
  }
}

export default config