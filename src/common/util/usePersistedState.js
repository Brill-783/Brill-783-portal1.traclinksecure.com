import { useState, useCallback } from 'react';

export default function usePersistedState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setPersistedValue = useCallback((newValue) => {
    setValue((prev) => {
      const next = typeof newValue === 'function' ? newValue(prev) : newValue;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // storage full or unavailable
      }
      return next;
    });
  }, [key]);

  return [value, setPersistedValue];
}
