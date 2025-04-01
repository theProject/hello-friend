import type { NextConfig } from 'next';

const config: NextConfig = {
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dalleproduse.blob.core.windows.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'featherblob.blob.core.windows.net',
        pathname: '/**',
      },
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
  async redirects() {
    return [
      {
        source: '/',
        destination: '/auth/signin',
        permanent: false,
      },
    ];
  },
};

export default config;

