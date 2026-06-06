// frontend/next.config.js

/** @type {import('next').NextConfig} */
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

module.exports = nextConfig;