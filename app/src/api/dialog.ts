import { apiClient } from './client';
import { emitSergbotUserMessage } from '@/lib/sergbot-session';
import { useUserStore } from '@/state/user';

export const dialogApi = {
  async sendMessage(taskId: string | undefined, content: string) {
    const userId = useUserStore.getState().userId;
    if (!userId) {
      throw new Error('Missing user identity for SergBot dialog.');
    }
    return emitSergbotUserMessage({
      userId,
      message: content,
      metadata: taskId ? { taskId } : undefined
    });
  },
  stream(taskId: string) {
    return apiClient.stream(`${process.env.NEXT_PUBLIC_WS_BASE ?? 'wss://placeholder.arc/ws'}/dialog/stream?jobId=${taskId}`);
  }
};
