"use client";

import type { BidTierSuggestion } from '@/types/task';
import { BidTierCard } from './BidTierCard';

interface BidTierSelectionProps {
  bids: BidTierSuggestion[];
  selected?: BidTierSuggestion;
  completedMap?: Record<string, boolean>;
  onSelect: (bid: BidTierSuggestion) => void;
  responses?: Record<string, Record<string, string>>;
  onResponseChange: (bidId: string, field: string, value: string) => void;
  onClearSelection?: () => void;
  executionState?: 'idle' | 'executing' | 'delivered';
}

export function BidTierSelection({ bids, selected, completedMap, onSelect, responses, onResponseChange, onClearSelection, executionState }: BidTierSelectionProps) {
  const visibleBids = selected ? bids.filter((bid) => bid.id === selected.id) : bids;
  const showingSingle = Boolean(selected);

  return (
    <div className={showingSingle ? 'space-y-4' : 'grid gap-4 md:grid-cols-3'}>
      {visibleBids.map((bid) => (
        <BidTierCard
          key={bid.id}
          bid={bid}
          selected={selected?.id === bid.id}
          completed={completedMap?.[bid.id]}
          onSelect={onSelect}
          responses={responses?.[bid.id]}
          onResponseChange={(field, value) => onResponseChange(bid.id, field, value)}
          executionState={executionState}
        />
      ))}
      {showingSingle && onClearSelection ? (
        <button
          type="button"
          onClick={onClearSelection}
          className="rounded-2xl border border-white/20 px-4 py-2 text-sm text-white/70 hover:border-white/40">
          Choose a different tier
        </button>
      ) : null}
    </div>
  );
}
