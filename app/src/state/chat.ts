import { create } from 'zustand';
import type { ChatMessage } from '@/types/dialog';
import type { BidTierSuggestion, TaskDetails } from '@/types/task';

interface ChatState {
  task?: TaskDetails;
  tasks: TaskDetails[];
  messages: ChatMessage[];
  bidDetails?: BidTierSuggestion;
  streaming: boolean;
  latestSergbotTaskId?: string;
  latestSergbotTaskStatus?: string;
  setTask: (task: TaskDetails) => void;
  appendMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setBidDetails: (tier?: BidTierSuggestion) => void;
  setStreaming: (streaming: boolean) => void;
  setSergbotTaskMeta: (payload?: { id?: string; status?: string }) => void;
}

function upsertTask(list: TaskDetails[], task: TaskDetails) {
  const index = list.findIndex((item) => item.task_id === task.task_id);
  if (index === -1) {
    return [...list, task];
  }
  const clone = [...list];
  clone[index] = { ...clone[index], ...task };
  return clone;
}

export const useChatStore = create<ChatState>((set) => ({
  tasks: [],
  messages: [],
  streaming: false,
  latestSergbotTaskId: undefined,
  latestSergbotTaskStatus: undefined,
  setTask: (task) =>
    set((state: ChatState) => ({
      task,
      tasks: upsertTask(state.tasks, task)
    })),
  appendMessage: (message) =>
    set((state: ChatState) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setBidDetails: (bidDetails) => set({ bidDetails }),
  setStreaming: (streaming) => set({ streaming }),
  setSergbotTaskMeta: (payload) =>
    set({
      latestSergbotTaskId: payload?.id,
      latestSergbotTaskStatus: payload?.status
    })
}));

export function resetChatStore() {
  useChatStore.setState({
    task: undefined,
    tasks: [],
    messages: [],
    bidDetails: undefined,
    streaming: false,
    latestSergbotTaskId: undefined,
    latestSergbotTaskStatus: undefined
  });
}
