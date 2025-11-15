import { apiClient } from './client';
import type { BidTierSuggestion, TaskDetails, TaskFeedback, TaskDispute } from '@/types/task';
import type { TaskResult } from '@/types/result';

type JobStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED';

interface JobBid {
  id: string;
  jobId: string;
  bidderWallet: string;
  price: string;
  deliveryTime: string;
  reputation: string;
  accepted: boolean;
  createdAt: string;
}

interface JobResponse {
  id: string;
  posterWallet: string;
  description: string;
  tags: string[];
  deadline: string | null;
  status: JobStatus;
  createdAt: string;
  bids: JobBid[];
}

const feedbackStore = new Map<string, TaskFeedback>();
const disputeStore = new Map<string, TaskDispute>();

const STATUS_MAP: Record<JobStatus, TaskDetails['status']> = {
  OPEN: 'awaiting_bid_selection',
  IN_PROGRESS: 'executing',
  COMPLETED: 'result_ready',
  DISPUTED: 'on_review'
};

const TIER_LABELS = ['economy', 'balanced', 'premium'];

function toMinutes(value?: string) {
  const seconds = Number(value ?? 0);
  return Math.max(1, Math.round(seconds / 60));
}

function mapBid(bid: JobBid, index: number): BidTierSuggestion {
  return {
    id: TIER_LABELS[index] ?? `tier-${index + 1}`,
    backend_bid_id: bid.id,
    price_usdc: Number(bid.price ?? 0).toFixed(2),
    time_estimate_min: toMinutes(bid.deliveryTime),
    agent_trust_stars: Number(bid.reputation ?? 3) || 3,
    description: bid.bidderWallet,
    required_fields: []
  };
}

function mapJob(job: JobResponse): TaskDetails {
  const bid_spread = job.bids.map(mapBid);
  const acceptedId = job.bids.find((bid) => bid.accepted)?.id;
  const selected_tier = acceptedId
    ? bid_spread.find((bid) => bid.backend_bid_id === acceptedId)
    : undefined;

  return {
    task_id: job.id,
    summary: job.description,
    bid_spread,
    status: STATUS_MAP[job.status] ?? 'awaiting_bid_selection',
    selected_tier,
    locked_price_usdc: selected_tier?.price_usdc,
    feedback: feedbackStore.get(job.id),
    dispute: disputeStore.get(job.id)
  };
}

export const tasksApi = {
  async create(initial_prompt: string) {
    const payload = {
      description: initial_prompt,
      tags: [],
      deadline: null
    };
    const { jobId } = await apiClient.post<{ jobId: string }>('/jobs', payload);
    const job = await apiClient.get<JobResponse>(`/jobs/${jobId}`);
    return mapJob(job);
  },
  selectTier(taskId: string, backendBidId: BidTierSuggestion['id']) {
    return apiClient.post(`/jobs/${taskId}/accept`, { bidId: backendBidId });
  },
  confirm(taskId: string) {
    return apiClient.post(`/jobs/${taskId}/approve`);
  },
  async fetch(taskId: string) {
    const job = await apiClient.get<JobResponse>(`/jobs/${taskId}`);
    return mapJob(job);
  },
  async result(taskId: string): Promise<TaskResult> {
    const job = await apiClient.get<JobResponse>(`/jobs/${taskId}`);
    const output: TaskResult['output'] = {
      type: 'json',
      value: job as unknown as Record<string, unknown>
    };
    return {
      task_id: job.id,
      output,
      completed_at: job.createdAt
    } satisfies TaskResult;
  },
  async feedback(taskId: string, payload: TaskFeedback) {
    feedbackStore.set(taskId, payload);
    return Promise.resolve(payload);
  },
  async dispute(taskId: string, payload: TaskDispute) {
    disputeStore.set(taskId, payload);
    return Promise.resolve(payload);
  }
};
