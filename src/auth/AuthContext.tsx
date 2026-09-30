import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SignInNotice } from '../components/SignInNotice';
import type { AuthUser } from './types';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => void;
  signOut: () => void;
  authError: string | null;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const user: AuthUser | null = null;

  useEffect(() => {
    setLoading(false);
  }, []);

  const signInWithGoogle = useCallback(() => {
    setNoticeOpen(true);
  }, []);

  const signOut = useCallback(() => {
    setAuthError(null);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, signOut, authError, clearAuthError }),
    [user, loading, signInWithGoogle, signOut, authError, clearAuthError],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SignInNotice open={noticeOpen} onClose={() => setNoticeOpen(false)} />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
