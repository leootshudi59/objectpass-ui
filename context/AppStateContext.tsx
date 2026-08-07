import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

interface AppStateContextValue {
  isLoading: boolean;
  loadingMessage: string | undefined;
  error: string | null;
  setLoading: (loading: boolean, message?: string) => void;
  setError: (message: string) => void;
  clearError: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const loadingCountRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);
  const [error, setErrorState] = useState<string | null>(null);

  const setLoading = useCallback((loading: boolean, message?: string) => {
    if (loading) {
      loadingCountRef.current += 1;
      setIsLoading(true);
      if (message !== undefined) setLoadingMessage(message);
    } else {
      loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);
      if (loadingCountRef.current === 0) {
        setIsLoading(false);
        setLoadingMessage(undefined);
      }
    }
  }, []);

  const setError = useCallback((message: string) => {
    setErrorState(message);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  return (
    <AppStateContext.Provider
      value={{ isLoading, loadingMessage, error, setLoading, setError, clearError }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
