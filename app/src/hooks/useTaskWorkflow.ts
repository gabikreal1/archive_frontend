"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useChatStore } from '@/state/chat';
import type { BidTierSuggestion, TaskDetails } from '@/types/task';
import { dialogApi } from '@/api/dialog';
import { tasksApi } from '@/api/tasks';
import { nanoid } from 'nanoid';
import type { ChatMessage } from '@/types/dialog';

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

  const [creatingTask, setCreatingTask] = useState(false);
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

  const createTask = useCallback(
    async (prompt: string) => {
      setCreatingTask(true);
      try {
        let created: TaskDetails;
        if (OFFLINE_MODE) {
          const fallback: TaskDetails = {
            task_id: `task-${Date.now()}`,
            summary: prompt,
            bid_spread: [
              {
                id: 'economy',
                price_usdc: '5.00',
                time_estimate_min: 5,
                agent_trust_stars: 3.1,
                description: 'Fastest delivery with concise QA.',
                required_fields: ['Success criteria']
              }
            ],
            status: 'awaiting_bid_selection'
          };
          created = fallback;
        } else {
          created = await tasksApi.create(prompt);
        }
        setTask({ ...created, status: created.status ?? 'awaiting_bid_selection' });
        setBidDetails(undefined);
        appendMessage({
          id: nanoid(),
          role: 'assistant',
          content: 'Here are the marketplace bids we just pulled in.',
          createdAt: new Date().toISOString()
        });
        return created;
      } finally {
        setCreatingTask(false);
      }
    },
    [appendMessage, setBidDetails, setTask]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: nanoid(),
        role: 'user',
        content,
        createdAt: new Date().toISOString()
      };
      appendMessage(userMessage);
      const activeTask = task ?? (await createTask(content));
      await dialogApi
        .sendMessage(activeTask.task_id, content)
        .catch((error) => console.warn('Dialog API unavailable', error));
    },
    [appendMessage, task, createTask]
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
      createTask,
      sendMessage,
      creatingTask,
      selectedTier,
      selectTier,
      clearSelectedTier,
      paymentSheetOpen,
      openPayment,
      closePayment
    }),
    [messages, task, createTask, sendMessage, creatingTask, selectedTier, selectTier, clearSelectedTier, paymentSheetOpen, openPayment, closePayment]
  );
}
