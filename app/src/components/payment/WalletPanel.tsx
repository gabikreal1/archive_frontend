"use client";

import { useState } from 'react';
import clsx from 'clsx';
import { CopyIcon, CheckIcon } from 'lucide-react';
import { useWallet } from '@/providers/wallet-provider';

function formatAddress(address?: string) {
  if (!address) return 'Not connected';
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

interface WalletPanelProps {
  className?: string;
}

export function WalletPanel({ className }: WalletPanelProps = {}) {
  const { connected, balance_usdc, address, connect } = useWallet();
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

  if (!connected) {
    return (
      <button
        type="button"
        onClick={connect}
        className={clsx(
          'rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur transition hover:border-white/40',
          className
        )}
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div
      className={clsx(
        'flex items-center gap-3 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-xs text-white shadow-sm backdrop-blur',
        className
      )}
    >
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase text-white/60">Balance</span>
        <span className="text-sm font-semibold">${balance_usdc} USDC</span>
      </div>
      <span className="h-6 w-px bg-white/15" aria-hidden="true" />
      <div className="flex items-center gap-2 text-[11px] text-white/70">
        <span>{formatAddress(address)}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy wallet address"
          className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/50"
        >
          {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
