import { apiClient } from './client';
import type { BidTierSuggestion, TaskDetails, TaskFeedback, TaskDispute } from '@/types/task';
import type { TaskResult } from '@/types/result';
import type { JobResponse } from '@/lib/task-map';
import { mapJobResponse } from '@/lib/task-map';

const feedbackStore = new Map<string, TaskFeedback>();
const disputeStore = new Map<string, TaskDispute>();

export interface JobCreationPayload {
  description: string;
  tags?: string[];
  deadline?: string | null;
}

function withTaskMeta(job: JobResponse): TaskDetails {
  return mapJobResponse(job, {
    feedback: feedbackStore.get(job.id),
    dispute: disputeStore.get(job.id)
  });
}

export const tasksApi = {
  create(payload: JobCreationPayload) {
    return apiClient.post<{ jobId: string; txHash?: string }>('/jobs', payload);
  },
  selectTier(taskId: string, backendBidId: BidTierSuggestion['id']) {
    return apiClient.post(`/jobs/${taskId}/accept`, { bidId: backendBidId });
  },
  confirm(taskId: string) {
    return apiClient.post(`/jobs/${taskId}/approve`);
  },
  async fetch(taskId: string) {
    const job = await apiClient.get<JobResponse>(`/jobs/${taskId}`);
    return withTaskMeta(job);
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
