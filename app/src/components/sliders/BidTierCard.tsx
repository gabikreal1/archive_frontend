"use client";

import type { BidTierSuggestion } from '@/types/task';
import { Card, Button, Input, Textarea } from '@/components/shared/ui';
import { TrustStars } from '@/components/shared/TrustStars';

interface BidTierCardProps {
  bid: BidTierSuggestion;
  selected?: boolean;
  completed?: boolean;
  onSelect: (bid: BidTierSuggestion) => void;
  responses?: Record<string, string>;
  onResponseChange: (field: string, value: string) => void;
  executionState?: 'idle' | 'executing' | 'delivered';
}

export function BidTierCard({ bid, selected, completed, onSelect, responses, onResponseChange, executionState }: BidTierCardProps) {
  const showForm = selected && (bid.required_fields?.length ?? 0) > 0;
  const showStatus = selected && executionState && executionState !== 'idle';

  const statusLabel = (() => {
    if (executionState === 'executing') return 'Agent is delivering your job…';
    if (executionState === 'delivered') return 'Delivery ready below';
    return undefined;
  })();

  return (
    <Card className={selected ? 'border-sky-400 bg-sky-400/10' : ''}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold capitalize">{bid.id}</p>
          <p className="text-2xl font-bold">${Number(bid.price_usdc).toFixed(2)}</p>
        </div>
        <TrustStars value={bid.agent_trust_stars} />
      </div>
      <p className="mt-2 text-sm text-white/70">
        ETA {bid.time_estimate_min} min · {bid.description ?? 'Marketplace bid'}
      </p>
      {showStatus && statusLabel ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
          {executionState === 'executing' ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" aria-hidden />
              {statusLabel}
            </span>
          ) : (
            <span className="text-emerald-300">{statusLabel}</span>
          )}
        </div>
      ) : null}
      <div className="mt-3 text-xs uppercase tracking-wide text-white/50">
        {completed ? 'Requirements completed' : bid.required_fields?.length ? `${bid.required_fields.length} required answers` : 'No extra requirements'}
      </div>
      {bid.required_fields?.length ? (
        <ul className="mt-2 space-y-1 text-sm text-white/60">
          {bid.required_fields.map((field) => (
            <li key={field} className="flex items-center gap-2">
              <span aria-hidden className="text-sky-400">•</span>
              <span>{field}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {showForm && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          <p className="text-xs uppercase tracking-wide text-white/60">Answer required questions</p>
          {bid.required_fields?.map((field) => (
            <div key={field}>
              <label className="text-xs uppercase text-white/60">{field}</label>
              {field.length > 20 ? (
                <Textarea
                  rows={2}
                  value={responses?.[field] ?? ''}
                  onChange={(event) => onResponseChange(field, event.target.value)}
                />
              ) : (
                <Input
                  value={responses?.[field] ?? ''}
                  onChange={(event) => onResponseChange(field, event.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {!selected && (
        <div className="mt-4">
          <Button type="button" className="w-full" onClick={() => onSelect(bid)}>
            Select Tier
          </Button>
        </div>
      )}
    </Card>
  );
}
