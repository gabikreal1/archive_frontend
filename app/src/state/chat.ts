import { create } from 'zustand';
import type { ChatMessage } from '@/types/dialog';
import type { BidTierSuggestion, TaskDetails } from '@/types/task';

interface ChatState {
  task?: TaskDetails;
  messages: ChatMessage[];
  bidDetails?: BidTierSuggestion;
  setTask: (task: TaskDetails) => void;
  appendMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setBidDetails: (tier?: BidTierSuggestion) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  setTask: (task) => set({ task }),
  appendMessage: (message) =>
    set((state: ChatState) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setBidDetails: (bidDetails) => set({ bidDetails })
}));
