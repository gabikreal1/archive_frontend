"use client";

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { nanoid } from 'nanoid';
import { useUserStore } from '@/state/user';
import { useChatStore } from '@/state/chat';
import { useWalletStore } from '@/state/wallet';
import type { ChatMessage } from '@/types/dialog';
import type { JobBid, JobResponse } from '@/lib/task-map';
import { mapAutopilotCandidate, mapJobResponse } from '@/lib/task-map';
import { tasksApi, type JobCreationPayload } from '@/api/tasks';
import { attachSergbotSocket, detachSergbotSocket, ensureConversationId } from '@/lib/sergbot-session';
import { mergeTaskDetails } from '@/lib/task-merge';
import type {
  AutopilotBidCandidate,
  BidTierSuggestion,
  JobAuctionRecommendationsPayload,
  JobExecutionOutput,
  JobRatingEventPayload,
  TaskDetails
} from '@/types/task';

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
    taskStatus?: string;
    task_status?: string;
    [key: string]: unknown;
  };
};

type AgentErrorPayload = {
  message?: string;
};

type AuctionStartedPayload = {
  jobId: string;
  deadline: number;
};

type ExecutorSelectedPayload = {
  jobId: string;
  candidate: AutopilotBidCandidate;
};

type ExecutionCompletedPayload = {
  jobId: string;
  result: JobExecutionOutput;
  deliveryId?: string;
};

type OrderbookBidPlacedPayload = {
  jobId: string;
  bidId: string;
  bidder: string;
  price: string | number;
  etaMinutes?: number;
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

function upsertAutopilotCandidate(list: AutopilotBidCandidate[] = [], candidate: AutopilotBidCandidate) {
  const index = list.findIndex((item) => item.id === candidate.id);
  if (index === -1) {
    return [...list, candidate];
  }
  const clone = [...list];
  clone[index] = candidate;
  return clone;
}

function upsertBidSuggestion(list: BidTierSuggestion[] = [], suggestion: BidTierSuggestion) {
  const getKey = (bid: BidTierSuggestion) => bid.backend_bid_id ?? bid.id;
  const targetKey = getKey(suggestion);
  const index = list.findIndex((bid) => getKey(bid) === targetKey);
  if (index === -1) {
    return [...list, suggestion];
  }
  const clone = [...list];
  clone[index] = suggestion;
  return clone;
}

function shortenAddress(address?: string) {
  if (!address) return 'unknown';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatOnchainPrice(raw?: string | number) {
  const value = typeof raw === 'string' ? Number(raw) : raw ?? 0;
  if (!Number.isFinite(value)) return '0.00';
  if (value > 10_000) {
    return (value / 1_000_000).toFixed(2);
  }
  return value.toFixed(2);
}

function mapOrderbookBidToSuggestion(payload: OrderbookBidPlacedPayload): BidTierSuggestion {
  return {
    id: `onchain-${payload.bidId}`,
    backend_bid_id: payload.bidId,
    price_usdc: formatOnchainPrice(payload.price),
    time_estimate_min: payload.etaMinutes ? Math.max(1, Math.round(payload.etaMinutes)) : 60,
    agent_trust_stars: 3,
    agent_id: payload.bidder,
    description: `On-chain bidder ${shortenAddress(payload.bidder)}`,
    required_fields: []
  };
}

async function ensureTaskLoaded(jobId: string): Promise<TaskDetails | undefined> {
  const state = useChatStore.getState();
  if (state.task?.task_id === jobId) return state.task;
  const existing = state.tasks.find((task) => task.task_id === jobId);
  if (existing) {
    state.setTask(existing);
    return existing;
  }
  try {
    const latest = await tasksApi.fetch(jobId);
    const merged = mergeTaskDetails(existing, latest);
    state.setTask(merged);
    return merged;
  } catch (error) {
    console.warn('Failed to hydrate task for websocket event', error);
    return undefined;
  }
}

function recommendationMapFromPayload(payload: JobAuctionRecommendationsPayload) {
  const premium = payload.recommendations.premium
    ? mapAutopilotCandidate(payload.recommendations.premium, 'premium')
    : undefined;
  const economy = payload.recommendations.economy
    ? mapAutopilotCandidate(payload.recommendations.economy, 'economy')
    : undefined;
  const map: Partial<Record<'premium' | 'economy', BidTierSuggestion>> = {
    premium,
    economy
  };
  const bids = [premium, economy].filter((bid): bid is BidTierSuggestion => Boolean(bid));
  return { map, bids };
}

function patchTask(jobId: string, patch: Partial<TaskDetails>) {
  const { updateTaskPartial } = useChatStore.getState();
  updateTaskPartial(jobId, patch);
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
      const rawTaskStatus = (payload.context?.taskStatus ?? payload.context?.task_status ?? payload.context?.sergbotTaskStatus) as
        | string
        | undefined;
      const { setSergbotTaskMeta } = useChatStore.getState();
      if (sergbotTaskId || rawTaskStatus) {
        setSergbotTaskMeta({
          id: sergbotTaskId,
          status: rawTaskStatus
        });
      } else {
        setSergbotTaskMeta();
      }
      if (sergbotTaskId) {
        await maybeSubmitJob(sergbotTaskId, payload.context);
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
        const state = useChatStore.getState();
        const current =
          state.task?.task_id === bid.jobId
            ? state.task
            : state.tasks.find((task) => task.task_id === bid.jobId);
        const merged = mergeTaskDetails(current, latest);
        state.setTask(merged);
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

    socket.on('job.auction.started', async (payload: AuctionStartedPayload) => {
      if (!shouldHandleJob(payload.jobId)) return;
      const task = await ensureTaskLoaded(payload.jobId);
      if (!task) return;
      patchTask(payload.jobId, {
        auction_deadline_ms: payload.deadline,
        auction_phase: 'collecting_bids',
        auction_total_bids: 0,
        auction_candidates: [],
        recommendations: undefined,
        selected_tier: undefined,
        locked_price_usdc: undefined
      });
      useChatStore.getState().setBidDetails(undefined);
    });

    socket.on('job.auction.bid', async (candidate: AutopilotBidCandidate) => {
      if (!shouldHandleJob(candidate.jobId)) return;
      const task = await ensureTaskLoaded(candidate.jobId);
      if (!task) return;
      const nextCandidates = upsertAutopilotCandidate(task.auction_candidates, candidate);
      const suggestion = mapAutopilotCandidate(candidate);
      const nextBidSpread = upsertBidSuggestion(task.bid_spread, suggestion);
      patchTask(candidate.jobId, {
        auction_candidates: nextCandidates,
        auction_total_bids: nextBidSpread.length,
        bid_spread: nextBidSpread,
        auction_phase: task.auction_phase ?? 'collecting_bids'
      });
    });

    socket.on('job.auction.recommendations', async (payload: JobAuctionRecommendationsPayload) => {
      if (!shouldHandleJob(payload.jobId)) return;
      const task = await ensureTaskLoaded(payload.jobId);
      if (!task) return;
      const { map, bids } = recommendationMapFromPayload(payload);
      patchTask(payload.jobId, {
        bid_spread: bids.length ? bids : task.bid_spread,
        recommendations: map,
        auction_total_bids: payload.totalBids,
        auction_phase: 'recommendations_ready'
      });
    });

    socket.on('chain:orderbook.bidPlaced', async (payload: OrderbookBidPlacedPayload) => {
      if (!shouldHandleJob(payload.jobId)) return;
      const task = await ensureTaskLoaded(payload.jobId);
      if (!task) return;
      const suggestion = mapOrderbookBidToSuggestion(payload);
      const nextBidSpread = upsertBidSuggestion(task.bid_spread, suggestion);
      patchTask(payload.jobId, {
        bid_spread: nextBidSpread,
        auction_total_bids: nextBidSpread.length,
        auction_phase: task.auction_phase ?? 'collecting_bids'
      });
    });

    socket.on('job.executor.selected', async (payload: ExecutorSelectedPayload) => {
      if (!shouldHandleJob(payload.jobId)) return;
      const task = await ensureTaskLoaded(payload.jobId);
      if (!task) return;
      const tierLabel = payload.candidate.tierHint === 'PREMIUM' ? 'premium' : payload.candidate.tierHint === 'ECONOMY' ? 'economy' : undefined;
      const selectedTier = mapAutopilotCandidate(payload.candidate, tierLabel);
      patchTask(payload.jobId, {
        selected_tier: selectedTier,
        locked_price_usdc: selectedTier.price_usdc,
        executor_candidate: payload.candidate,
        auction_phase: 'executor_selected'
      });
      useChatStore.getState().setBidDetails(selectedTier);
    });

    socket.on('job.execution.completed', async (payload: ExecutionCompletedPayload) => {
      if (!shouldHandleJob(payload.jobId)) return;
      try {
        const latest = await tasksApi.fetch(payload.jobId);
        const state = useChatStore.getState();
        const current =
          state.task?.task_id === payload.jobId
            ? state.task
            : state.tasks.find((task) => task.task_id === payload.jobId);
        const merged = mergeTaskDetails(current, latest, {
          execution_result: payload.result,
          auction_phase: 'execution_completed',
          delivery_id: payload.deliveryId ?? current?.delivery_id
        });
        state.setTask(merged);
      } catch (error) {
        console.warn('Failed to refresh job after execution completion', error);
        const task = await ensureTaskLoaded(payload.jobId);
        if (!task) return;
        patchTask(payload.jobId, {
          execution_result: payload.result,
          auction_phase: 'execution_completed',
          status: 'result_ready',
          delivery_id: payload.deliveryId ?? task.delivery_id
        });
      }
    });

    socket.on('job.rating.submitted', async (payload: JobRatingEventPayload) => {
      if (!shouldHandleJob(payload.jobId)) return;
      const task = await ensureTaskLoaded(payload.jobId);
      if (!task) return;
      patchTask(payload.jobId, {
        feedback: {
          rating: payload.rating,
          comment: payload.feedback
        },
        auction_phase: 'rating_submitted'
      });
    });

    return () => {
      detachSergbotSocket(socket);
      socket.disconnect();
    };
  }, [token, authenticated, userId]);
}
