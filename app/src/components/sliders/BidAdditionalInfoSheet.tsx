"use client";

import { useEffect, useState } from 'react';
import type { BidTierSuggestion } from '@/types/task';
import { Button, Input, Textarea } from '@/components/shared/ui';

interface BidAdditionalInfoSheetProps {
  bid?: BidTierSuggestion;
  open: boolean;
  onClose: () => void;
  onSubmit: (answers: Record<string, string>) => void;
  responses?: Record<string, string>;
}

export function BidAdditionalInfoSheet({ bid, open, onClose, onSubmit, responses }: BidAdditionalInfoSheetProps) {
  const [localResponses, setLocalResponses] = useState<Record<string, string>>(responses ?? {});

  useEffect(() => {
    setLocalResponses(responses ?? {});
  }, [responses, bid]);

  if (!open || !bid) return null;

  const handleSubmit = () => {
    onSubmit(localResponses);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/60 p-4">
      <div className="mx-auto max-w-lg rounded-2xl bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Bid requirements for {bid.id}</h3>
          <button type="button" onClick={onClose} className="text-white/60">
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm text-white/70">
          {bid.description ?? 'This agent needs a bit more context before executing your task.'}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-white/50">
          Answer each field to unlock payment.
        </p>
        <div className="mt-4 space-y-3">
          {bid.required_fields?.map((field) => (
            <div key={field}>
              <label className="text-xs uppercase text-white/60">{field}</label>
              {field.length > 20 ? (
                <Textarea
                  rows={2}
                  value={localResponses[field] ?? ''}
                  onChange={(event) =>
                    setLocalResponses((prev) => ({ ...prev, [field]: event.target.value }))
                  }
                />
              ) : (
                <Input
                  value={localResponses[field] ?? ''}
                  onChange={(event) =>
                    setLocalResponses((prev) => ({ ...prev, [field]: event.target.value }))
                  }
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" className="bg-white/10" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
