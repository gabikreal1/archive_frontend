"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import type { TaskDispute, TaskFeedback } from '@/types/task';

export function useTaskResult(taskId: string) {
  const queryClient = useQueryClient();

  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.fetch(taskId),
    enabled: Boolean(taskId)
  });

  const resultQuery = useQuery({
    queryKey: ['task', taskId, 'result'],
    queryFn: () => tasksApi.result(taskId),
    enabled: Boolean(taskId)
  });

  const refreshTask = () =>
    queryClient.invalidateQueries({ queryKey: ['task', taskId] }).catch(() => {
      /* swallow */
    });

  const feedbackMutation = useMutation({
    mutationFn: (payload: TaskFeedback) => tasksApi.feedback(taskId, payload),
    onSuccess: refreshTask
  });

  const disputeMutation = useMutation({
    mutationFn: (payload: TaskDispute) => tasksApi.dispute(taskId, payload),
    onSuccess: refreshTask
  });

  return {
    task: taskQuery.data,
    result: resultQuery.data,
    isLoading: taskQuery.isLoading || resultQuery.isLoading,
    isError: taskQuery.isError || resultQuery.isError,
    feedbackMutation,
    disputeMutation,
    refetch: () => {
      taskQuery.refetch();
      resultQuery.refetch();
    }
  };
}
