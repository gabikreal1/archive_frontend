"use client";

import { ChatMessage } from '@/types/dialog';
import { cn } from '@/lib/utils';
import { MessageBubble } from './MessageBubble';
import { ThinkingIndicator } from './ThinkingIndicator';

interface ChatPanelProps {
  messages: ChatMessage[];
  streaming?: boolean;
  awaitingExecutor?: boolean;
}

export function ChatPanel({ messages, streaming, awaitingExecutor }: ChatPanelProps) {
  const visibleMessages = messages.filter((message) =>
    message.kind === 'agent_user_message' || message.kind === 'agent_bot_message'
  );
  const hasVisibleMessages = visibleMessages.length > 0;
  return (
    <div
      className={cn(
        'flex h-full flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4',
        !hasVisibleMessages && !awaitingExecutor && 'min-h-0 border-0 bg-transparent p-0'
      )}
    >
      {visibleMessages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {streaming ? <ThinkingIndicator /> : null}
      {awaitingExecutor ? (
        <div className="max-w-2xl rounded-2xl border border-indigo-400/20 bg-indigo-400/10 p-4 text-sm text-indigo-100">
          <p className="text-xs uppercase tracking-wide text-indigo-200">Searching for agents</p>
          <div className="mt-1 flex items-center gap-1 font-medium">
            Please wait while we line up executor agents
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-200" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-200" style={{ animationDelay: '0.15s' }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-200" style={{ animationDelay: '0.3s' }} />
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
