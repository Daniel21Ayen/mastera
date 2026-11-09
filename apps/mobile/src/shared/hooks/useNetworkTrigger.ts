import { useState, useEffect } from 'react';

/**
 * Hook for detecting connection status and triggering debounced sync (DWN-09).
 */
export function useNetworkTrigger(onConnectionRestored?: () => void) {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // In browser or mobile environment
    const handleOnline = () => {
      setIsOnline(true);
      if (onConnectionRestored) {
        onConnectionRestored();
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    return undefined;
  }, [onConnectionRestored]);

  return { isOnline };
}
