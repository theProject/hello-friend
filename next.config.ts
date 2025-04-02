// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  images: {
    remotePatterns: [
      // ...
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        'pdf-parse': false,
      };
    }
    return config;
  },
  // async block caused this whole nextauth mess
};

export default config;


