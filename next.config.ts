import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    domains: ['dalleproduse.blob.core.windows.net'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        'pdf-parse': false,
      }
    }
    return config
  },
}

export default config
