import type {NextConfig} from 'next';
// @ts-ignore - pwa type is not available
import withPWA from 'next-pwa';

const isProduction = process.env.NODE_ENV === 'production';

const pwaConfig = {
  dest: 'public',
  disable: !isProduction,
  cacheOnFrontEndNav: true,
  fallbacks: { image: '/icon-192.png' },
  runtimeCaching: [
    {
      urlPattern: /\/tessdata\/.*\.traineddata\.gz$/i,
      handler: 'CacheFirst',
      options: { cacheName: 'tessdata', expiration: { maxEntries: 20 } }
    },
    {
      urlPattern: /\/tesseract\/.*\.(?:wasm|js)$/i,
      handler: 'CacheFirst',
      options: { cacheName: 'tesseract-core', expiration: { maxEntries: 20 } }
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'google-fonts' }
    }
  ]
};

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

// Wrap the config with PWA only in production
const exportConfig = isProduction ? withPWA(pwaConfig)(nextConfig) : nextConfig;

export default exportConfig;
