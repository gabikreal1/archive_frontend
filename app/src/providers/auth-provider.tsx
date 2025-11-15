"use client";

import { ReactNode, createContext, useContext, useMemo, useEffect, useRef } from 'react';
import { useUserStore } from '@/state/user';
import { useWalletStore } from '@/state/wallet';

interface AuthContextValue {
  authenticated: boolean;
  loading: boolean;
  hydrated: boolean;
  signIn: (email?: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const authenticated = useUserStore((s) => s.authenticated);
  const loading = useUserStore((s) => s.loading);
  const hydrated = useUserStore((s) => s.hydrated);
  const signIn = useUserStore((s) => s.signIn);
  const signOut = useUserStore((s) => s.signOut);
  const hydrate = useUserStore((s) => s.hydrate);
  const attempted = useRef(false);
  const walletConnected = useWalletStore((s) => s.connected);
  const connectWallet = useWalletStore((s) => s.connect);
  const disconnectWallet = useWalletStore((s) => s.disconnect);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (authenticated) {
      if (!walletConnected) {
        void connectWallet().catch((error) => {
          console.warn('Automatic wallet link failed', error);
        });
      }
    } else if (walletConnected) {
      disconnectWallet();
    }
  }, [authenticated, hydrated, walletConnected, connectWallet, disconnectWallet]);

  const value = useMemo(
    () => ({ authenticated, loading, hydrated, signIn, signOut }),
    [authenticated, loading, hydrated, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
