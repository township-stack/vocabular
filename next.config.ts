import type {NextConfig} from 'next';
// @ts-ignore - pwa type is not available
import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  fallbacks: { image: '/icon-192.png' },
  runtimeCaching: [
    {
      urlPattern: /\/tessdata\/.*\.traineddata$/i,
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
});


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

export default pwaConfig(nextConfig);
