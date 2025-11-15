"use client";

import { useState } from 'react';
import { ResultContainer } from '@/components/result/ResultContainer';
import { ResultRenderer } from '@/components/result/ResultRenderer';
import { FeedbackSection } from '@/components/result/FeedbackSection';
import { DownloadButton } from '@/components/result/DownloadButton';
import { DisputePromptSheet } from '@/components/result/DisputePromptSheet';
import { useTaskResult } from '@/hooks/useTaskResult';
import { Card } from '@/components/shared/ui';
import type { ResultPayload } from '@/types/result';

interface ResultPageProps {
  params: { task_id: string };
}

function formatCompletedDate(value?: string) {
  if (!value) return 'Pending';
  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function isDownloadable(payload?: ResultPayload) {
  if (!payload) return false;
  if (payload.type === 'files') {
    return payload.value.length > 0;
  }
  return true;
}

export default function ResultPage({ params }: ResultPageProps) {
  const [disputeOpen, setDisputeOpen] = useState(false);
  const { task, result, isLoading, isError, feedbackMutation, disputeMutation } = useTaskResult(params.task_id);

  const handleDownload = () => {
    if (!result) return;
    const { output, task_id } = result;

    if (output.type === 'link') {
      window.open(output.value, '_blank', 'noopener,noreferrer');
      return;
    }

    let filename = `task-${task_id}-result`;
    let mime = 'text/plain';
    let contents: string | undefined;

    switch (output.type) {
      case 'text':
        contents = output.value;
        filename += '.txt';
        break;
      case 'markdown':
        contents = output.value;
        filename += '.md';
        break;
      case 'html':
        contents = output.value;
        filename += '.html';
        mime = 'text/html';
        break;
      case 'json':
        contents = JSON.stringify(output.value, null, 2);
        filename += '.json';
        mime = 'application/json';
        break;
      case 'files':
        contents = JSON.stringify({ files: output.value }, null, 2);
        filename += '-files.json';
        mime = 'application/json';
        break;
      default:
        contents = JSON.stringify(output, null, 2);
        filename += '.json';
        mime = 'application/json';
    }

    if (!contents) return;

    const blob = new Blob([contents], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const selectedTier = task?.selected_tier;
  const completedAt = formatCompletedDate(result?.completed_at);
  let downloadLabel = 'Download Result';
  if (result?.output.type === 'link') downloadLabel = 'Open External Link';
  if (result?.output.type === 'files') downloadLabel = 'Download File Manifest';

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <ResultContainer>
          <p className="text-sm text-white/70">Loading result…</p>
        </ResultContainer>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <ResultContainer>
          <p className="text-sm text-rose-300">Unable to load this task result.</p>
        </ResultContainer>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <ResultContainer>
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase text-white/60">Task</p>
          <h1 className="text-2xl font-bold">{task.summary ?? `Result #${task.task_id}`}</h1>
          <p className="text-sm text-white/60">Status: {task.status}</p>
        </div>
        {result ? (
          <ResultRenderer payload={result.output} />
        ) : (
          <p className="rounded-lg bg-white/5 p-4 text-sm text-white/60">
            Final output is not available yet. Check back soon.
          </p>
        )}
        <DownloadButton
          disabled={!result || !isDownloadable(result?.output)}
          label={downloadLabel}
          onClick={result ? handleDownload : undefined}
        />
      </ResultContainer>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase text-white/50">Completed</p>
          <p className="text-base font-semibold">{completedAt}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-white/50">Tier</p>
          <p className="text-base font-semibold capitalize">
            {selectedTier?.id ?? 'Not selected'}
          </p>
          {selectedTier && (
            <p className="text-sm text-white/60">
              ${selectedTier.price_usdc} · {selectedTier.agent_trust_stars.toFixed(1)}★
            </p>
          )}
        </Card>
        <Card>
          <p className="text-xs uppercase text-white/50">Task ID</p>
          <p className="text-base font-semibold">{task.task_id}</p>
        </Card>
      </div>

      {task.dispute?.opened && (
        <Card className="border-rose-400/40 bg-rose-500/10">
          <p className="text-sm font-semibold text-rose-200">Dispute in review</p>
          <p className="text-sm text-rose-100/80">{task.dispute.reason}</p>
        </Card>
      )}

      <FeedbackSection
        feedback={task.feedback}
        submitting={feedbackMutation.isPending}
        onSubmit={async (rating, comment) => {
          await feedbackMutation.mutateAsync({ rating, comment });
        }}
        onDispute={() => setDisputeOpen(true)}
      />
      <DisputePromptSheet
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        onSubmit={async (reason) => {
          await disputeMutation.mutateAsync({ opened: true, reason });
        }}
      />
    </div>
  );
}
