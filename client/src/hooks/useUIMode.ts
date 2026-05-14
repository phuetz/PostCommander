import { useEffect, useState, useCallback } from 'react';

export type UIMode = 'simple' | 'expert';

const STORAGE_KEY = 'pc.uiMode';
const DEFAULT_MODE: UIMode = 'simple';

function readMode(): UIMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'simple' || v === 'expert' ? v : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

// Cross-tab sync via storage event + same-tab broadcast.
const listeners = new Set<(mode: UIMode) => void>();

function broadcast(mode: UIMode) {
  listeners.forEach((fn) => fn(mode));
}

export function useUIMode() {
  const [mode, setMode] = useState<UIMode>(readMode);

  useEffect(() => {
    const onListener = (next: UIMode) => setMode(next);
    listeners.add(onListener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'simple' || e.newValue === 'expert')) {
        setMode(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(onListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setUIMode = useCallback((next: UIMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota errors */
    }
    setMode(next);
    broadcast(next);
  }, []);

  const toggle = useCallback(() => {
    setUIMode(mode === 'simple' ? 'expert' : 'simple');
  }, [mode, setUIMode]);

  return { mode, setUIMode, toggle, isSimple: mode === 'simple', isExpert: mode === 'expert' };
}
