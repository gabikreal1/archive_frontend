"use client";

import { useMemo, useState } from 'react';
import { WalletPanel } from '@/components/payment/WalletPanel';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ChatInput } from '@/components/chat/ChatInput';
import { BidTierSelection } from '@/components/sliders/BidTierSelection';
import { PaymentSheet } from '@/components/payment/PaymentSheet';
import { useTaskWorkflow } from '@/hooks/useTaskWorkflow';
import type { BidTierSuggestion } from '@/types/task';

export function HomeScreen() {
  const workflow = useTaskWorkflow();
  const [bidResponses, setBidResponses] = useState<Record<string, Record<string, string>>>({});

  const handleBidSelect = (bid: BidTierSuggestion) => {
    workflow.selectTier(bid);
  };

  const handleBidFieldChange = (bidId: string, field: string, value: string) => {
    setBidResponses((prev) => ({
      ...prev,
      [bidId]: {
        ...(prev[bidId] ?? {}),
        [field]: value,
      },
    }));
  };

  const completionMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    (workflow.task?.bid_spread ?? []).forEach((bid) => {
      const required = bid.required_fields ?? [];
      if (!required.length) {
        map[bid.id] = true;
        return;
      }
      const answers = bidResponses[bid.id];
      map[bid.id] = Boolean(
        answers && required.every((field) => (answers[field] ?? '').trim().length > 0)
      );
    });
    return map;
  }, [bidResponses, workflow.task?.bid_spread]);

  const canProceed = useMemo(() => {
    if (!workflow.selectedTier) return false;
    const required = workflow.selectedTier.required_fields ?? [];
    if (!required.length) return true;
    return completionMap[workflow.selectedTier.id];
  }, [completionMap, workflow.selectedTier]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6">
      <WalletPanel />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <ChatPanel messages={workflow.messages} />
          <ChatInput onSubmit={workflow.sendMessage} disabled={workflow.creatingTask} />
        </div>
        <div className="space-y-4">
          {workflow.task ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase text-white/50">Task Summary</p>
                <p className="text-lg font-semibold">{workflow.task.summary}</p>
              </div>
              <BidTierSelection
                bids={workflow.task.bid_spread}
                selected={workflow.selectedTier}
                completedMap={completionMap}
                onSelect={handleBidSelect}
                responses={bidResponses}
                onResponseChange={handleBidFieldChange}
                onClearSelection={workflow.clearSelectedTier}
              />
              <button
                type="button"
                disabled={!canProceed}
                onClick={workflow.openPayment}
                className="w-full rounded-2xl bg-sky-500 py-3 text-center text-sm font-semibold disabled:opacity-40">
                Proceed to Payment
              </button>
              {!canProceed && workflow.selectedTier && (
                <p className="text-sm text-amber-300">
                  Answer the required questions for the {workflow.selectedTier.id} bid before paying.
                </p>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/20 p-6 text-sm text-white/60">
              Submit a prompt to see bids.
            </div>
          )}
        </div>
      </div>
      <PaymentSheet
        open={workflow.paymentSheetOpen}
        tier={workflow.selectedTier}
        taskId={workflow.task?.task_id}
        onClose={workflow.closePayment}
      />
    </div>
  );
}
