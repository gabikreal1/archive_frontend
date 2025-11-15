import type { BidTierSuggestion } from '@/types/task';

interface PriceBreakdownProps {
  tier?: BidTierSuggestion;
}

export function PriceBreakdown({ tier }: PriceBreakdownProps) {
  if (!tier) return null;
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span>Tier</span>
        <span className="capitalize">{tier.id}</span>
      </div>
      <div className="flex justify-between">
        <span>Price</span>
        <span>${tier.price_usdc}</span>
      </div>
      <div className="flex justify-between">
        <span>Trust</span>
        <span>{tier.agent_trust_stars.toFixed(1)} ★</span>
      </div>
    </div>
  );
}
