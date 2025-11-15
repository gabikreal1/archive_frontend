import { apiClient } from './client';

export const walletApi = {
  balance() {
    return apiClient.get<{ walletAddress: string; usdcBalance: string }>('/wallet/balance');
  },
  deposit(amount: string, paymentMethod = 'card') {
    return apiClient.post<{ depositUrl?: string }>('/wallet/deposit', {
      amount,
      paymentMethod
    });
  }
};
