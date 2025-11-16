"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useChatStore } from '@/state/chat';
import type { BidTierSuggestion, TaskDetails } from '@/types/task';
import { dialogApi } from '@/api/dialog';
import { tasksApi } from '@/api/tasks';
import { nanoid } from 'nanoid';
import type { ChatMessage } from '@/types/dialog';
import { mergeTaskDetails } from '@/lib/task-merge';
import { useWalletStore } from '@/state/wallet';

const EXECUTOR_QUEUE_STATUSES = new Set(['awaiting_executor', 'matching_executor', 'searching_executor']);

function isAwaitingExecutorStatus(status?: string) {
  if (!status) return false;
  return EXECUTOR_QUEUE_STATUSES.has(status.toLowerCase());
}

const OFFLINE_MODE =
  process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true' ||
  process.env.NEXT_PUBLIC_OFFLINE_MODE === '1' ||
  process.env.NEXT_PUBLIC_OFFLINE_MODE === 'mock';

async function refreshWalletBalance() {
  try {
    await useWalletStore.getState().refresh();
  } catch (error) {
    console.warn('Wallet balance refresh failed', error);
  }
}

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
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  useEffect(() => {
    if (task?.selected_tier) {
      setSelectedTier(task.selected_tier);
    }
  }, [task?.selected_tier]);

  const refreshTask = useCallback(async (taskId: string) => {
    if (OFFLINE_MODE) return;
    const latest = await tasksApi.fetch(taskId);
    const existing = useChatStore
      .getState()
      .tasks.find((storedTask) => storedTask.task_id === taskId);
    const merged: TaskDetails = mergeTaskDetails(existing ?? task, latest);
    setTask(merged);
    return merged;
  }, [setTask, task]);

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
      void refreshWalletBalance();
    },
    [setBidDetails, task, refreshTask]
  );

  const openPayment = useCallback(() => setPaymentSheetOpen(true), []);
  const closePayment = useCallback(() => setPaymentSheetOpen(false), []);
  const clearSelectedTier = useCallback(() => {
    setSelectedTier(undefined);
    setBidDetails(undefined);
  }, [setBidDetails]);

  const submitRating = useCallback(
    async (rating: number, comment?: string) => {
      if (!task?.task_id) return;
      if (!task.delivery_id) {
        if (typeof window !== 'undefined') {
          window.alert('Delivery is not ready yet. Please wait for the agent to finish.');
        }
        return;
      }

      try {
        setRatingSubmitting(true);
        await tasksApi.submitRating(task.task_id, {
          deliveryId: task.delivery_id,
          rating,
          feedback: comment?.trim() ? comment.trim() : undefined
        });
        setTask({
          ...task,
          feedback: {
            rating,
            comment
          },
          auction_phase: 'rating_submitted'
        });
        void refreshWalletBalance();
      } catch (error) {
        console.warn('Failed to submit rating', error);
        if (typeof window !== 'undefined') {
          window.alert('Could not submit rating. Please try again.');
        }
      } finally {
        setRatingSubmitting(false);
      }
    },
    [task, setTask]
  );

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
      streaming,
      submitRating,
      ratingSubmitting
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
      streaming,
      submitRating,
      ratingSubmitting
    ]
  );
}
