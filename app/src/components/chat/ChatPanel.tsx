"use client";

import { ChatMessage } from '@/types/dialog';
import { MessageBubble } from './MessageBubble';
import { ThinkingIndicator } from './ThinkingIndicator';

interface ChatPanelProps {
  messages: ChatMessage[];
  streaming?: boolean;
}

export function ChatPanel({ messages, streaming }: ChatPanelProps) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {streaming ? <ThinkingIndicator /> : null}
      {messages.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-white/70">
          Ask anything about your task, then we will fetch bids automatically.
        </div>
      )}
    </div>
  );
}
