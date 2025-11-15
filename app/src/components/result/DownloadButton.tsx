"use client";

import { Button } from '@/components/shared/ui';

interface DownloadButtonProps {
  disabled?: boolean;
  label?: string;
  onClick?: () => void;
}

export function DownloadButton({ disabled, label = 'Download Bundle', onClick }: DownloadButtonProps) {
  return (
    <Button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full bg-white/10 disabled:opacity-40"
    >
      {label}
    </Button>
  );
}
