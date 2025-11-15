"use client";

import { QueryClientProvider } from './query-client-provider';
import { AuthProvider } from './auth-provider';
import { WalletProvider } from './wallet-provider';
import { ReactNode, useEffect } from 'react';
import { registerServiceWorker } from '@/lib/pwa/register-sw';
import { AuthGate } from '@/components/auth/AuthGate';

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <QueryClientProvider>
      <AuthProvider>
        <AuthGate>
          <WalletProvider>{children}</WalletProvider>
        </AuthGate>
      </AuthProvider>
    </QueryClientProvider>
  );
}
