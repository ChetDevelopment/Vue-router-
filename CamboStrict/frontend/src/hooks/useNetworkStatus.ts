import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    let unsubscribe: (() => void) | null = null;

    import('@react-native-community/netinfo').then((NetInfo) => {
      unsubscribe = NetInfo.addEventListener((state) => {
        setIsOnline(state.isConnected ?? true);
        setConnectionType(state.type);
      });
    }).catch(() => {});

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { isOnline, connectionType };
}
