import { useRef, useCallback } from 'react';

export function useDoubleTap(onDoubleTap: () => void, delay = 300) {
  const lastTap = useRef(0);

  return useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < delay) {
      onDoubleTap();
    }
    lastTap.current = now;
  }, [onDoubleTap, delay]);
}
