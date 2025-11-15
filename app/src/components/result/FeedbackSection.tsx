"use client";

import { useEffect, useState } from 'react';
import { Button, Textarea } from '@/components/shared/ui';
import { SubmitDisputeButton } from './SubmitDisputeButton';
import type { TaskFeedback } from '@/types/task';

interface FeedbackSectionProps {
  onSubmit: (rating: number, comment?: string) => Promise<void> | void;
  onDispute: () => void;
  submitting?: boolean;
  feedback?: TaskFeedback;
}

export function FeedbackSection({ onSubmit, onDispute, submitting, feedback }: FeedbackSectionProps) {
  const [rating, setRating] = useState<number>(feedback?.rating ?? 5);
  const [comment, setComment] = useState(feedback?.comment ?? '');
  const [submitted, setSubmitted] = useState(Boolean(feedback));

  useEffect(() => {
    if (feedback) {
      setRating(feedback.rating);
      setComment(feedback.comment ?? '');
      setSubmitted(true);
    }
  }, [feedback]);

  const handleSubmit = async () => {
    await onSubmit(rating, comment);
    setSubmitted(true);
    if (rating <= 2) onDispute();
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 p-4">
      <p className="text-sm font-semibold">Rate your experience</p>
      <div className="flex gap-2 text-2xl">
        {Array.from({ length: 5 }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setRating(index + 1)}
            className={index < rating ? 'text-amber-400' : 'text-white/40'}
          >
            ★
          </button>
        ))}
      </div>
      <Textarea
        rows={3}
        placeholder="Optional comment"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      {rating >= 3 && submitted && (
        <p className="text-sm text-emerald-400">Thanks for the feedback! ⭐</p>
      )}
      {rating <= 2 && submitted && (
        <p className="text-sm text-rose-400">Consider opening a dispute below.</p>
      )}
      <div className="flex flex-col gap-2">
        <Button type="button" onClick={handleSubmit} className="w-full" disabled={submitting}>
          {submitting ? 'Submitting…' : submitted ? 'Update Feedback' : 'Submit'}
        </Button>
        {rating <= 2 ? <SubmitDisputeButton onClick={onDispute} /> : null}
      </div>
    </div>
  );
}
