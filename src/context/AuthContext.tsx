import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AuthState } from '@/types';
import { api, storage } from '@/utils/api';

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; token: string }
  | { type: 'LOGIN_FAILURE'; error: string }
  | { type: 'LOGOUT' }
  | { type: 'INIT_FROM_STORAGE'; token: string };

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
    case 'INIT_FROM_STORAGE':
      return { isAuthenticated: true, isLoading: false, error: null };
    case 'LOGIN_FAILURE':
      return { isAuthenticated: false, isLoading: false, error: action.error };
    case 'LOGOUT':
      return { isAuthenticated: false, isLoading: false, error: null };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize from localStorage on mount
  useEffect(() => {
    const token = storage.getToken();
    if (token) {
      api.setToken(token);
      dispatch({ type: 'INIT_FROM_STORAGE', token });
    } else {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const login = useCallback(async (password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await api.login(password);
      storage.setToken(response.token);
      api.setToken(response.token);
      dispatch({ type: 'LOGIN_SUCCESS', token: response.token });
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        error: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    storage.removeToken();
    storage.clearTasksCache();
    api.setToken(null);
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
