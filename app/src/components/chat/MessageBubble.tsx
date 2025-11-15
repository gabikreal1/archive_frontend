"use client";

import type { ChatMessage } from '@/types/dialog';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
}

const ROLE_LABEL: Record<ChatMessage['role'], string> = {
  user: 'You',
  assistant: 'Agent',
  system: 'System'
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wide text-white/50">
        {ROLE_LABEL[message.role]}
      </div>
      <div
        className={cn(
          'max-w-2xl rounded-2xl border border-white/10 p-4 text-sm shadow-md',
          isUser ? 'ml-auto bg-white/10' : 'bg-black/30'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
