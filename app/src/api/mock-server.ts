import { nanoid } from 'nanoid';
import type { ChatMessage } from '@/types/dialog';
import type {
  BidTierSuggestion,
  CreatedTaskResponse,
  TaskDetails,
  TaskDispute,
  TaskFeedback
} from '@/types/task';
import type { TaskResult } from '@/types/result';

const MOCK_BIDS: BidTierSuggestion[] = [
  {
    id: 'economy',
    price_usdc: '5.00',
    time_estimate_min: 5,
    agent_trust_stars: 3.1,
    description: 'Fastest delivery with concise QA.',
    required_fields: ['Success criteria']
  },
  {
    id: 'balanced',
    price_usdc: '12.50',
    time_estimate_min: 12,
    agent_trust_stars: 4.3,
    description: 'Balanced approach with double-checks.',
    required_fields: ['Preferred tone']
  },
  {
    id: 'premium',
    price_usdc: '25.00',
    time_estimate_min: 20,
    agent_trust_stars: 4.9,
    description: 'Premium agent with best trust score.',
    required_fields: ['Detailed scope', 'Review assets']
  }
];

let currentTask: TaskDetails | undefined;

function ensureTaskSummary(prompt?: string) {
  if (!currentTask) {
    const created: CreatedTaskResponse = {
      task_id: `task-${nanoid(6)}`,
      summary: prompt ?? 'Demo marketplace run',
      bid_spread: MOCK_BIDS
    };
    currentTask = {
      ...created,
      status: 'awaiting_bid_selection'
    };
  }
  return currentTask;
}

function respondWithMessage(taskId: string, content: string): ChatMessage {
  return {
    id: nanoid(),
    role: 'assistant',
    content: `Echoing “${content}” for task ${taskId}.`,
    createdAt: new Date().toISOString(),
    status: 'complete',
    kind: 'agent_bot_message'
  };
}

const mockResult: TaskResult = {
  task_id: 'demo-result',
  completed_at: new Date().toISOString(),
  output: {
    type: 'markdown',
    value: '## Demo Result\nYour task has been executed in mock mode.'
  }
};

function parseBody(body?: BodyInit | null) {
  if (!body) return undefined;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (error) {
      console.warn('Failed to parse mock body', error);
      return undefined;
    }
  }
  return body;
}

export function handleMockRequest<T>(path: string, init?: RequestInit): T {
  const method = (init?.method ?? 'GET').toUpperCase();
  const segments = path.split('/').filter(Boolean);
  const payload = parseBody(init?.body);

  if (segments[0] === 'dialog' && segments[1] === 'messages' && method === 'POST') {
    const content = (payload as { content?: string })?.content ?? '';
    const jobId = (payload as { jobId?: string; taskId?: string })?.taskId ??
      (payload as { jobId?: string })?.jobId ??
      ensureTaskSummary().task_id;
    return respondWithMessage(jobId, content) as T;
  }

  if (segments[0] === 'tasks') {
    if (segments.length === 1 && method === 'POST') {
      const prompt = (payload as { initial_prompt?: string })?.initial_prompt ?? 'Demo prompt';
      const created = ensureTaskSummary(prompt);
      return { ...created } as T;
    }

    const taskId = segments[1] ?? ensureTaskSummary().task_id;
    const subPath = segments[2];
    const task = ensureTaskSummary();
    task.task_id = taskId;

    if (!subPath && method === 'GET') {
      return { ...task } as T;
    }

    if (subPath === 'select-tier' && method === 'POST') {
      const tierId = (payload as { tier_id?: BidTierSuggestion['id'] })?.tier_id ?? 'balanced';
      const tier = MOCK_BIDS.find((option) => option.id === tierId) ?? MOCK_BIDS[1];
      currentTask = { ...task, selected_tier: tier, status: 'awaiting_payment', bid_spread: MOCK_BIDS };
      return {
        task_id: taskId,
        tier_id: tier.id,
        locked_price_usdc: tier.price_usdc
      } as T;
    }

    if (subPath === 'confirm' && method === 'POST') {
      currentTask = { ...task, status: 'executing' };
      return { task_id: taskId, status: 'executing' } as T;
    }

    if (subPath === 'dialog' && segments[3] === 'messages' && method === 'POST') {
      const content = (payload as { content?: string })?.content ?? '';
      return respondWithMessage(taskId, content) as T;
    }

    if (subPath === 'feedback' && method === 'POST') {
      currentTask = { ...task, feedback: payload as TaskFeedback };
      return { task_id: taskId, feedback: payload as TaskFeedback } as T;
    }

    if (subPath === 'dispute' && method === 'POST') {
      const dispute: TaskDispute = {
        opened: true,
        reason: (payload as TaskDispute)?.reason ?? 'Mock dispute reason',
        created_at: new Date().toISOString()
      };
      currentTask = { ...task, dispute };
      return { task_id: taskId, dispute } as T;
    }

    if (subPath === 'result' && method === 'GET') {
      return { ...mockResult, task_id: taskId } as T;
    }
  }

  if (segments[0] === 'wallet' && segments[1] === 'pay' && method === 'POST') {
    return { status: 'paid' } as T;
  }

  return { ok: true } as T;
}
