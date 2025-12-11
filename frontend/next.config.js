// frontend/next.config.js

/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  // Activation of automatic skipWaiting
  skipWaiting: true,
  // Disable in dev mode to not interfere with fast reloads
  disable: process.env.NODE_ENV === 'development',
  register: true,
  // Addition of runTimeCaching (good practice for the PWA)
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.(js|css|woff2?|png|jpg|webp|svg)/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
      },
    },
  ],
});

// Define the Next.js configuration in a single object
const nextConfig = {
  reactStrictMode: true,
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'flagcdn.com',
            //pathname: '/**', // Can be used if you want to be stricter on the path
          },
        ],
      },
};

// Export the unique result of applying the PWA wrapper to the configuration
module.exports = nextConfig;
///module.exports = withPWA(nextConfig);