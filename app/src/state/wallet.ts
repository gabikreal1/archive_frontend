import { create } from 'zustand';
import type { WalletConnection } from '@/types/wallet';
import { walletApi } from '@/api/wallet';

interface WalletState extends WalletConnection {
  connect: () => Promise<void>;
  disconnect: () => void;
  requestPayment: (amount: string) => Promise<boolean>;
}

const initial: WalletConnection = {
  address: '',
  balance_usdc: '0.00',
  connected: false,
  network: 'arc-testnet'
};

export const useWalletStore = create<WalletState>((set, get) => ({
  ...initial,
  async connect() {
    const balance = await walletApi.balance();
    set({
      connected: true,
      address: balance.walletAddress,
      balance_usdc: balance.usdcBalance,
      network: 'arc-testnet'
    });
  },
  disconnect() {
    set(initial);
  },
  async requestPayment(amount: string) {
    if (!get().connected) return false;
    try {
      const deposit = await walletApi.deposit(amount);
      if (deposit?.depositUrl && typeof window !== 'undefined') {
        window.open(deposit.depositUrl, '_blank', 'noopener,noreferrer');
      }
      const refreshed = await walletApi.balance();
      set({ balance_usdc: refreshed.usdcBalance });
      return true;
    } catch (error) {
      console.error('Wallet payment failed', error);
      return false;
    }
  }
}));
