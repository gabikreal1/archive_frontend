"use client";

import { Button } from '@/components/shared/ui';

interface SubmitDisputeButtonProps {
  onClick: () => void;
}

export function SubmitDisputeButton({ onClick }: SubmitDisputeButtonProps) {
  return (
    <Button
      type="button"
      className="w-full !bg-rose-600 !text-white hover:!bg-rose-500"
      onClick={onClick}
    >
      Submit Dispute
    </Button>
  );
}
