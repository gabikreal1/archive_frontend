"use client";

import { FormEvent, useState } from 'react';
import { Button, Textarea } from '@/components/shared/ui';

interface ChatInputProps {
  onSubmit: (value: string) => Promise<void> | void;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;
    await onSubmit(value.trim());
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        rows={3}
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Describe your task prompt..."
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={disabled}>
          Send
        </Button>
      </div>
    </form>
  );
}
