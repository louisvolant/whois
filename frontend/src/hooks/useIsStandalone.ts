// frontend/src/hooks/useIsStandalone.ts
import { useState } from 'react';

export function useIsStandalone() {
  const [isStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')
    );
  });

  return isStandalone;
}