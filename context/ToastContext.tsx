import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastEntry {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  removing: boolean;
}

interface ToastContextValue {
  toasts: ToastEntry[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const EXIT_ANIMATION_MS = 300;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const hideToast = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];

    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)));

    const exitKey = `${id}_exit`;
    timers.current[exitKey] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timers.current[exitKey];
    }, EXIT_ANIMATION_MS + 50);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', duration = 3000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type, duration, removing: false }]);
      timers.current[id] = setTimeout(() => hideToast(id), duration);
    },
    [hideToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
