import { circleRequest } from './client';

export interface CircleWallet {
  id: string;
  address?: string;
  blockchain: string;
  accountType: 'EOA' | 'SCA' | string;
  metadata?: Record<string, unknown>;
}

export interface CircleWalletRequest {
  label: string;
  accountType: 'EOA' | 'SCA';
  blockchain: string;
  appId?: string;
  userToken?: string;
  metadata?: Record<string, unknown>;
}

const walletCreatePath = process.env.CIRCLE_WALLET_CREATE_PATH;
const walletAppId = process.env.CIRCLE_WALLET_APP_ID;

export async function createCircleWallet(request: CircleWalletRequest): Promise<CircleWallet> {
  if (!walletCreatePath) {
    throw new Error('Set CIRCLE_WALLET_CREATE_PATH to the wallet creation endpoint documented by Circle.');
  }

  return circleRequest<CircleWallet>(walletCreatePath, {
    method: 'POST',
    body: JSON.stringify({
      ...request,
      appId: request.appId ?? walletAppId
    })
  });
}
