import { useCallback, useState } from 'react';

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2500);
  }, []);

  return { message, show, clear: () => setMessage(null) };
}
