import { apiClient } from './client';
import type { ChatMessage } from '@/types/dialog';

export const dialogApi = {
  sendMessage(taskId: string, content: string) {
    return apiClient.post<ChatMessage>(`/tasks/${taskId}/dialog/messages`, {
      content
    });
  },
  stream(taskId: string) {
    return apiClient.stream(`${process.env.NEXT_PUBLIC_WS_BASE ?? 'wss://placeholder.arc/ws'}/tasks/${taskId}/stream`);
  }
};
