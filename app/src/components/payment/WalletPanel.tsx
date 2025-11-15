"use client";

import { useState } from 'react';
import { Button } from '@/components/shared/ui';
import { CopyIcon, CheckIcon } from 'lucide-react';
import { useWallet } from '@/providers/wallet-provider';

function formatAddress(address?: string) {
  if (!address) return 'Not connected';
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletPanel() {
  const { connected, balance_usdc, network, address, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!connected || !address || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy wallet address', error);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-semibold">ARC Wallet ({network})</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
          <span>{formatAddress(connected ? address : undefined)}</span>
          {connected && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy wallet address"
              className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 text-white transition hover:border-white/40"
            >
              {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
        <p className="text-lg font-bold">{connected ? `$${balance_usdc} USDC` : '--'}</p>
      </div>
      <Button
        type="button"
        onClick={connected ? disconnect : connect}
        className="self-stretch md:self-auto"
      >
        {connected ? 'Disconnect' : 'Connect Wallet'}
      </Button>
    </div>
  );
}
