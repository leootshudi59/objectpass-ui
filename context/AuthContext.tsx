import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

export type { User };

const STORAGE_KEY = '@objectpass_auth';

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'RESTORE'; payload: { isLoggedIn: boolean; user: User | null } }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE':
      return { isLoading: false, isLoggedIn: action.payload.isLoggedIn, user: action.payload.user };
    case 'LOGIN':
      return { isLoading: false, isLoggedIn: true, user: action.payload };
    case 'LOGOUT':
      return { isLoading: false, isLoggedIn: false, user: null };
  }
}

interface AuthContextType {
  state: AuthState;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    isLoggedIn: false,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    const restore = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const { user } = JSON.parse(stored) as { user: User };
          dispatch({ type: 'RESTORE', payload: { isLoggedIn: true, user } });
        } else {
          dispatch({ type: 'RESTORE', payload: { isLoggedIn: false, user: null } });
        }
      } catch {
        dispatch({ type: 'RESTORE', payload: { isLoggedIn: false, user: null } });
      }
    };

    // Brief splash delay before reading storage
    const timer = setTimeout(restore, 300);
    return () => clearTimeout(timer);
  }, []);

  const login = useCallback(async (user: User) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
    dispatch({ type: 'LOGIN', payload: user });
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
