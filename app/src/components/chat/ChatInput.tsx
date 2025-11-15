"use client";

import { FormEvent, KeyboardEvent, useCallback, useState } from 'react';
import { Button, Textarea } from '@/components/shared/ui';

interface ChatInputProps {
  onSubmit: (value: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSubmit, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');

  const dispatchMessage = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    await onSubmit(trimmed);
    setValue('');
  }, [onSubmit, value]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (disabled) return;
    await dispatchMessage();
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await dispatchMessage();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        rows={3}
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Describe your task prompt...'}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={disabled}>
          Send
        </Button>
      </div>
    </form>
  );
}
