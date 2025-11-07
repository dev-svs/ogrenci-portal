// client/src/utils/ui.js
import { useEffect } from 'react';

export function useAutoDismiss(message, setMessage, ms = 3000) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), ms);
    return () => clearTimeout(t);
  }, [message, setMessage, ms]);
}
