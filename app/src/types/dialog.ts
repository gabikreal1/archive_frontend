export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  status?: 'pending' | 'streaming' | 'complete';
}

export interface StreamEvent {
  type: 'thinking' | 'token' | 'message_complete';
  message_id: string;
  payload: string;
}
