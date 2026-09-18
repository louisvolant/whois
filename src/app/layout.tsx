// frontend/src/app/layout.tsx (Server Component)
import './globals.css';
import type { Metadata, Viewport } from 'next';
import Footer from './Footer';
import Image from 'next/image';

import PwaZoomPrevention from './components/PwaZoomPrevention';
import ServiceWorkerRegister from './components/ServiceWorkerRegister';

// 1. Separate Viewport export with zoom prevention for mobile and PWA
export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// 2. Metadata for PWA assets
export const metadata: Metadata = {
  title: 'Whois IP & Domain',
  description: 'A tool to get whois for IP&Domain',
  icons: {
    icon: [
      { url: '/icon-whois.png', type: 'image/png', sizes: '512x512' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: { url: '/favicon.ico', type: 'image/x-icon' },
    apple: [{ url: '/icons/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Whois',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en">
      <body className="antialiased bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
        <ServiceWorkerRegister />
        <PwaZoomPrevention />
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 text-white shadow-md pt-safe-top">
          <div className="container mx-auto px-4 py-4 flex items-center">
            <Image
              src="/icon-whois.png"
              alt="Whois Logo"
              width={32}
              height={32}
              priority
              className="h-8 w-8 mr-2"
            />
            <h1 className="text-2xl font-bold">Whois IP & Domain</h1>
          </div>
        </header>

          {/* Main content */}
          <main>{children}</main>
          <Footer />
      </body>
    </html>
  );
}