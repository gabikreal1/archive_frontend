"use client";

import { BidTierSuggestion } from '@/types/task';
import { Button, Card } from '@/components/shared/ui';
import { PriceBreakdown } from './PriceBreakdown';
import { useWallet } from '@/providers/wallet-provider';
import { useRouter } from 'next/navigation';

interface PaymentSheetProps {
  open: boolean;
  tier?: BidTierSuggestion;
  taskId?: string;
  onClose: () => void;
}

export function PaymentSheet({ open, tier, taskId, onClose }: PaymentSheetProps) {
  const wallet = useWallet();
  const router = useRouter();

  if (!open || !tier) return null;

  const handlePay = async () => {
    const paid = await wallet.requestPayment(tier.price_usdc);
    if (paid) {
      onClose();
      if (taskId) {
        router.push(`/result/${taskId}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-30 bg-black/70 p-4">
      <div className="mx-auto max-w-md">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase text-white/50">Task</p>
              <p className="text-lg font-semibold">{taskId ?? 'Pending task'}</p>
            </div>
            <button type="button" onClick={onClose} className="text-white/60">
              ✕
            </button>
          </div>
          <PriceBreakdown tier={tier} />
          <Button type="button" className="mt-6 w-full" onClick={handlePay}>
            Pay with ARC Wallet
          </Button>
        </Card>
      </div>
    </div>
  );
}
