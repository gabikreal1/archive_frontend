"use client";

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { nanoid } from 'nanoid';
import { useUserStore } from '@/state/user';
import { useChatStore } from '@/state/chat';
import { useWalletStore } from '@/state/wallet';
import type { ChatMessage } from '@/types/dialog';
import type { JobBid, JobResponse } from '@/lib/task-map';
import { mapJobResponse } from '@/lib/task-map';
import { tasksApi, type JobCreationPayload } from '@/api/tasks';
import { attachSergbotSocket, detachSergbotSocket, ensureConversationId } from '@/lib/sergbot-session';

const WS_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';
const OFFLINE_MODE =
  process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true' ||
  process.env.NEXT_PUBLIC_OFFLINE_MODE === '1' ||
  process.env.NEXT_PUBLIC_OFFLINE_MODE === 'mock';

type JobWithBidPayload = {
  job: JobResponse;
  bid: JobBid;
};

type AgentBotMessagePayload = {
  conversationId: string;
  message: string;
  context?: {
    sergbotTaskId?: string;
    sergbotTaskStatus?: string;
    [key: string]: unknown;
  };
};

type AgentErrorPayload = {
  message?: string;
};

const submittedSergbotTaskIds = new Set<string>();

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const normalized = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => Boolean(item));
  return normalized.length ? normalized : undefined;
}

function extractJobPayload(context?: AgentBotMessagePayload['context']): JobCreationPayload | undefined {
  if (!context || typeof context !== 'object') return undefined;
  const record = context as Record<string, unknown>;
  const candidate =
    (record.jobPayload as Record<string, unknown> | undefined) ??
    (record.jobDraft as Record<string, unknown> | undefined) ??
    (record.taskPayload as Record<string, unknown> | undefined) ??
    (record.taskDraft as Record<string, unknown> | undefined) ??
    record;
  if (!candidate) return undefined;

  const description = candidate.description;
  if (typeof description !== 'string' || !description.trim()) return undefined;

  const tags = normalizeStringArray(candidate.tags);
  const { deadline } = candidate;

  const payload: JobCreationPayload = {
    description: description.trim()
  };

  if (tags) payload.tags = tags;
  if (typeof deadline === 'string' && deadline.trim()) payload.deadline = deadline;

  return payload;
}

async function maybeSubmitJob(taskId?: string, context?: AgentBotMessagePayload['context']) {
  if (!taskId || submittedSergbotTaskIds.has(taskId)) return;
  const payload = extractJobPayload(context);
  if (!payload) return;

  try {
    submittedSergbotTaskIds.add(taskId);
    await tasksApi.create(payload);
  } catch (error) {
    submittedSergbotTaskIds.delete(taskId);
    console.error('Failed to submit job for SergBot task', error);
    if (typeof window !== 'undefined') {
      window.alert('Something went wrong while submitting your task. Please try again.');
    }
  }
}

function shouldHandleJob(jobId: string, posterWallet?: string) {
  const state = useChatStore.getState();
  if (state.task?.task_id === jobId) return true;
  if (state.tasks.some((task) => task.task_id === jobId)) return true;
  const wallet = useWalletStore.getState().address?.toLowerCase();
  if (!wallet || !posterWallet) return false;
  return posterWallet.toLowerCase() === wallet;
}

function appendAgentBotMessage(content: string) {
  const { appendMessage } = useChatStore.getState();
  const message: ChatMessage = {
    id: nanoid(),
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
    status: 'complete',
    kind: 'agent_bot_message'
  };
  appendMessage(message);
}

function updateTask(job: JobResponse) {
  const { setTask } = useChatStore.getState();
  setTask(mapJobResponse(job));
}

function stopStreaming() {
  const { setStreaming } = useChatStore.getState();
  setStreaming(false);
}

export function useRealtimeSocket() {
  const token = useUserStore((state) => state.accessToken);
  const authenticated = useUserStore((state) => state.authenticated);
  const userId = useUserStore((state) => state.userId);

  useEffect(() => {
    if (!token || !authenticated || OFFLINE_MODE) return;

    const socket = io(WS_BASE, {
      transports: ['websocket'],
      auth: { token },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    attachSergbotSocket(socket);

    socket.on('connect', () => {
      if (userId) {
        const conversationId = ensureConversationId();
        socket.emit('agent_join', {
          conversationId,
          userId,
          context: { source: 'mobile_app' }
        });
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Realtime connect_error', error);
      if (typeof window !== 'undefined') {
        window.alert('Unable to reach the live agent. Retrying…');
      }
    });

    socket.on('disconnect', (reason) => {
      console.warn('Realtime disconnected', reason);
    });

    socket.on('agent_bot_message', async (payload: AgentBotMessagePayload) => {
      appendAgentBotMessage(payload.message);
      stopStreaming();
      const sergbotTaskId = payload.context?.sergbotTaskId;
      const { setSergbotTaskMeta } = useChatStore.getState();
      if (sergbotTaskId) {
        setSergbotTaskMeta({
          id: sergbotTaskId,
          status: payload.context?.sergbotTaskStatus as string | undefined
        });
        await maybeSubmitJob(sergbotTaskId, payload.context);
      } else {
        setSergbotTaskMeta();
      }
    });

    socket.on('agent_error', (payload: AgentErrorPayload) => {
      console.error('Task agent_error', payload);
      if (typeof window !== 'undefined') {
        window.alert(payload.message ?? 'Something went wrong while preparing your task.');
      }
      stopStreaming();
    });

    socket.on('new_job', (job: JobResponse) => {
      if (!shouldHandleJob(job.id, job.posterWallet)) return;
      updateTask(job);
    });

    socket.on('new_bid', async (bid: JobBid) => {
      if (!shouldHandleJob(bid.jobId)) return;
      try {
        const latest = await tasksApi.fetch(bid.jobId);
        const { setTask } = useChatStore.getState();
        setTask(latest);
      } catch (error) {
        console.warn('Failed to refresh job after bid', error);
      }
    });

    socket.on('job_awarded', ({ job }: JobWithBidPayload) => {
      if (!shouldHandleJob(job.id, job.posterWallet)) return;
      updateTask(job);
    });

    socket.on('delivery_submitted', ({ job }: { job: JobResponse }) => {
      if (!shouldHandleJob(job.id, job.posterWallet)) return;
      updateTask(job);
    });

    socket.on('payment_released', ({ job }: JobWithBidPayload) => {
      if (!shouldHandleJob(job.id, job.posterWallet)) return;
      updateTask(job);
    });

    return () => {
      detachSergbotSocket(socket);
      socket.disconnect();
    };
  }, [token, authenticated, userId]);
}
