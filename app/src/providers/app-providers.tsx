"use client";

import { QueryClientProvider } from './query-client-provider';
import { AuthProvider } from './auth-provider';
import { WalletProvider } from './wallet-provider';
import { ReactNode, useEffect } from 'react';
import { registerServiceWorker } from '@/lib/pwa/register-sw';
import { AuthGate } from '@/components/auth/AuthGate';
import { RealtimeProvider } from './realtime-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    registerServiceWorker();
  }, []);

  return (
    <QueryClientProvider>
      <AuthProvider>
        <AuthGate>
          <WalletProvider>
            <RealtimeProvider>{children}</RealtimeProvider>
          </WalletProvider>
        </AuthGate>
      </AuthProvider>
    </QueryClientProvider>
  );
}
