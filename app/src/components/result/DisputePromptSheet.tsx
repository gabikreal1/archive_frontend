"use client";

import { Button } from '@/components/shared/ui';
import { DisputeReasonForm } from './DisputeReasonForm';

interface DisputePromptSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void> | void;
}

export function DisputePromptSheet({ open, onClose, onSubmit }: DisputePromptSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 bg-black/70 p-4">
      <div className="mx-auto max-w-lg rounded-2xl bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Open Dispute</h3>
          <button type="button" onClick={onClose} className="text-white/60">
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm text-white/70">
          Tell us what went wrong so we can review this task.
        </p>
        <DisputeReasonForm
          onSubmit={async (value) => {
            await onSubmit(value);
            onClose();
          }}
        />
        <Button type="button" className="mt-3 w-full bg-white/10" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
