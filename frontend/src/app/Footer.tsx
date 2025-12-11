// frontend/src/app/Footer.tsx
"use client";

import Link from 'next/link';
import { externalLinks } from './links';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [isDarkMode, setIsDarkMode] = useState(false);


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

  return (
    <footer className="bg-white dark:bg-gray-900 py-4 mt-8 transition-colors duration-300">
      <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
        <div className="mb-4">
          {externalLinks.map((link, index) => (
            <span key={link.href}>
              <Link href={link.href} className="mx-2 hover:text-gray-800 dark:hover:text-gray-100">
                {link.label}
              </Link>
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