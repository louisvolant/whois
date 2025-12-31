// frontend/src/app/Footer.tsx
"use client";

import { externalLinks } from './links';
import { useState, useEffect } from 'react';
import { useIsStandalone } from '../hooks/useIsStandalone';

export default function Footer() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const isStandalone = useIsStandalone();

  // Sync with system preference on mount + respect manual toggle
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      const pref = saved === 'true';
      setIsDarkMode(pref);
      if (pref) document.documentElement.classList.add('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      if (prefersDark) document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(newMode));
  };

  // Handle click for PWA breakout
  const handleExternalClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isStandalone) {
      e.preventDefault();
      // Using window.open triggers the system browser interaction on iOS
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <footer className="bg-white dark:bg-gray-900 py-4 mt-8 transition-colors duration-300 pb-[calc(1rem+var(--spacing-safe-bottom))]">
      <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
        <div className="mb-4">
          {externalLinks.map((link, index) => (
            <span key={link.href}>
              {/* Use native <a> for external links to avoid Next.js prefetching/internal routing */}
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleExternalClick(e, link.href)}
                className="mx-2 hover:text-gray-800 dark:hover:text-gray-100 cursor-pointer"
              >
                {link.label}
              </a>
              {index < externalLinks.length - 1 && <span>|</span>}
            </span>
          ))}
        </div>

        <button
          onClick={toggleDarkMode}
          className="py-2 px-4 bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-200"
        >
          Switch to {isDarkMode ? 'Light' : 'Dark'} Mode
        </button>

        <div className="mt-4">
          © {new Date().getFullYear()} LouisVolant.com. All rights reserved.
        </div>
      </div>
    </footer>
  );
}