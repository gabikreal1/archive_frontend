"use client";

import { useState } from 'react';
import { Button, Textarea } from '@/components/shared/ui';

interface DisputeReasonFormProps {
  onSubmit: (reason: string) => Promise<void> | void;
}

export function DisputeReasonForm({ onSubmit }: DisputeReasonFormProps) {
  const [reason, setReason] = useState('');
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 p-4">
      <Textarea
        rows={3}
        placeholder="Explain the issue"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <Button type="button" className="w-full bg-rose-500" onClick={() => onSubmit(reason)}>
        Submit Dispute
      </Button>
    </div>
  );
}
