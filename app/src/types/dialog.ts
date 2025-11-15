export type ChatMessageKind = 'agent_user_message' | 'agent_bot_message' | 'system';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  status?: 'pending' | 'streaming' | 'complete';
  kind: ChatMessageKind;
}

export interface StreamEvent {
  type: 'thinking' | 'token' | 'message_complete';
  message_id: string;
  payload: string;
}
