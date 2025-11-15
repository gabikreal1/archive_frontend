import { NextRequest, NextResponse } from 'next/server';
import { createCircleWallet } from '@/lib/circle/wallets';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const wallet = await createCircleWallet({
      label: payload?.label ?? 'arc-user-wallet',
      accountType: payload?.accountType ?? 'EOA',
      blockchain: payload?.blockchain ?? 'ETH-SEPOLIA',
      metadata: payload?.metadata,
      userToken: payload?.userToken
    });
    return NextResponse.json({ wallet });
  } catch (error) {
    console.error('Circle wallet create failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown Circle error' },
      { status: 500 }
    );
  }
}
