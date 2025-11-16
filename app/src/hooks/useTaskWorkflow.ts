"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useChatStore } from '@/state/chat';
import type { BidTierSuggestion } from '@/types/task';
import { dialogApi } from '@/api/dialog';
import { tasksApi } from '@/api/tasks';
import { nanoid } from 'nanoid';
import type { ChatMessage } from '@/types/dialog';

const EXECUTOR_QUEUE_STATUSES = new Set(['awaiting_executor', 'matching_executor', 'searching_executor']);

function isAwaitingExecutorStatus(status?: string) {
  if (!status) return false;
  return EXECUTOR_QUEUE_STATUSES.has(status.toLowerCase());
}

const OFFLINE_MODE =
  process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true' ||
  process.env.NEXT_PUBLIC_OFFLINE_MODE === '1' ||
  process.env.NEXT_PUBLIC_OFFLINE_MODE === 'mock';

export function useTaskWorkflow() {
  const setTask = useChatStore((state) => state.setTask);
  const setBidDetails = useChatStore((state) => state.setBidDetails);
  const appendMessage = useChatStore((state) => state.appendMessage);
  const messages = useChatStore((state) => state.messages);
  const task = useChatStore((state) => state.task);
  const streaming = useChatStore((state) => state.streaming);
  const setStreaming = useChatStore((state) => state.setStreaming);
  const latestSergbotTaskId = useChatStore((state) => state.latestSergbotTaskId);
  const latestSergbotTaskStatus = useChatStore((state) => state.latestSergbotTaskStatus);
  const awaitingExecutor = isAwaitingExecutorStatus(latestSergbotTaskStatus);

  const [selectedTier, setSelectedTier] = useState<BidTierSuggestion | undefined>();
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);

  useEffect(() => {
    if (task?.selected_tier) {
      setSelectedTier(task.selected_tier);
    }
  }, [task?.selected_tier]);

  const refreshTask = useCallback(
    async (taskId: string) => {
      if (OFFLINE_MODE) return;
      const latest = await tasksApi.fetch(taskId);
      setTask(latest);
      return latest;
    },
    [setTask]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      if (awaitingExecutor) return;
      const userMessage: ChatMessage = {
        id: nanoid(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
        kind: 'agent_user_message'
      };
      appendMessage(userMessage);
      setStreaming(true);
      try {
        if (!OFFLINE_MODE) {
          const sergbotAwareId = latestSergbotTaskId ?? task?.task_id;
          await dialogApi.sendMessage(sergbotAwareId, content);
        }
        setStreaming(false);
      } catch (error) {
        console.warn('Dialog send failed', error);
        if (typeof window !== 'undefined') {
          window.alert('We could not reach the agent. Please try again shortly.');
        }
        setStreaming(false);
      }
    },
    [appendMessage, task?.task_id, latestSergbotTaskId, setStreaming, awaitingExecutor]
  );

  const selectTier = useCallback(
    async (tier: BidTierSuggestion) => {
      if (!task) return;
      setSelectedTier(tier);
      setBidDetails(tier);
      if (!OFFLINE_MODE) {
        await tasksApi.selectTier(task.task_id, tier.backend_bid_id ?? tier.id);
        await refreshTask(task.task_id);
      }
    },
    [setBidDetails, task, refreshTask]
  );

  const openPayment = useCallback(() => setPaymentSheetOpen(true), []);
  const closePayment = useCallback(() => setPaymentSheetOpen(false), []);
  const clearSelectedTier = useCallback(() => {
    setSelectedTier(undefined);
    setBidDetails(undefined);
  }, [setBidDetails]);

  return useMemo(
    () => ({
      messages,
      task,
      sendMessage,
      latestSergbotTaskId,
      latestSergbotTaskStatus,
      awaitingExecutor,
      selectedTier,
      selectTier,
      clearSelectedTier,
      paymentSheetOpen,
      openPayment,
      closePayment,
      streaming
    }),
    [
      messages,
      task,
      sendMessage,
      latestSergbotTaskId,
      latestSergbotTaskStatus,
      awaitingExecutor,
      selectedTier,
      selectTier,
      clearSelectedTier,
      paymentSheetOpen,
      openPayment,
      closePayment,
      streaming
    ]
  );
}
