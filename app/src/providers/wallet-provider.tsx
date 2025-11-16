"use client";

import { ReactNode, createContext, useContext, useMemo } from 'react';
import { useWalletStore } from '@/state/wallet';

interface WalletContextValue {
  address: string;
  balance_usdc: string;
  connected: boolean;
  network: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  requestPayment: (amount: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const value = useWalletStore((state) => ({
    address: state.address,
    balance_usdc: state.balance_usdc,
    connected: state.connected,
    network: state.network,
    connect: state.connect,
    disconnect: state.disconnect,
    requestPayment: state.requestPayment,
    refresh: state.refresh
  }));

  const memoized = useMemo(() => value, [value]);

  return <WalletContext.Provider value={memoized}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
}
