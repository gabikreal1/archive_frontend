"use client";

import { useCallback, useMemo, useState } from 'react';
import { CheckIcon, CopyIcon, LogOut, Menu } from 'lucide-react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ChatInput } from '@/components/chat/ChatInput';
import { BidTierSelection } from '@/components/sliders/BidTierSelection';
import { PaymentSheet } from '@/components/payment/PaymentSheet';
import { useTaskWorkflow } from '@/hooks/useTaskWorkflow';
import type { BidTierSuggestion } from '@/types/task';
import { TaskSidebar } from '@/components/routes/TaskSidebar';
import { resetChatStore, useChatStore } from '@/state/chat';
import { useAuth } from '@/providers/auth-provider';
import { resetSergbotSession } from '@/lib/sergbot-session';
import { useWalletStore } from '@/state/wallet';
import { ExecutionResultCard } from '@/components/result/ExecutionResultCard';
import { FeedbackSection } from '@/components/result/FeedbackSection';
import { DisputePromptSheet } from '@/components/result/DisputePromptSheet';
import { tasksApi } from '@/api/tasks';

export function HomeScreen() {
  const workflow = useTaskWorkflow();
  const [bidResponses, setBidResponses] = useState<Record<string, Record<string, string>>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const tasks = useChatStore((state) => state.tasks);
  const setStoreTask = useChatStore((state) => state.setTask);
  const { signOut } = useAuth();
  const balance = useWalletStore((state) => state.balance_usdc);
  const walletConnected = useWalletStore((state) => state.connected);
  const address = useWalletStore((state) => state.address);
  const [copied, setCopied] = useState(false);

  const formattedAddress = useMemo(() => {
    if (!walletConnected || !address) return '--';
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  }, [walletConnected, address]);

  const handleLogout = useCallback(() => {
    resetChatStore();
    resetSergbotSession();
    useWalletStore.getState().disconnect();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('arc-auth-token');
        sessionStorage.clear();
      } catch (error) {
        console.warn('Failed to clear cached auth state', error);
      }
    }
    signOut();
  }, [signOut]);

  const handleCopyAddress = useCallback(async () => {
    if (!walletConnected || !address || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.warn('Failed to copy wallet address', error);
    }
  }, [walletConnected, address]);

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

  const executionState: 'idle' | 'executing' | 'delivered' = useMemo(() => {
    if (workflow.task?.execution_result) return 'delivered';
    if (
      workflow.task?.auction_phase === 'executor_selected' ||
      workflow.task?.status === 'executing'
    ) {
      return 'executing';
    }
    return 'idle';
  }, [workflow.task?.auction_phase, workflow.task?.execution_result, workflow.task?.status]);

  const hasAgents = Boolean(workflow.task?.bid_spread?.length);
  const showPaymentAction = hasAgents && Boolean(workflow.selectedTier);
  const hasChatHistory = useMemo(
    () =>
      workflow.messages.some(
        (message) =>
          message.kind === 'agent_user_message' || message.kind === 'agent_bot_message'
      ),
    [workflow.messages]
  );

  return (
    <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6 pt-28">
      <div className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center px-6">
          <button
            type="button"
            aria-label="Toggle task sidebar"
            aria-pressed={sidebarOpen}
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-slate-900/80 text-white transition hover:border-white/50 hover:bg-slate-800/80"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative flex flex-1 justify-center">
            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs text-white">
              <span className="text-sm font-semibold">
                {walletConnected ? `$${balance} USDC` : '--'}
              </span>
              <span className="text-white/40">•</span>
              <div className="flex items-center gap-2 text-[11px]">
                <span>{formattedAddress}</span>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  aria-label="Copy wallet address"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/50"
                >
                  {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white transition hover:border-white/50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      <TaskSidebar open={sidebarOpen} tasks={tasks} onClose={() => setSidebarOpen(false)} />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <ChatPanel
            messages={workflow.messages}
            streaming={workflow.streaming}
            awaitingExecutor={workflow.awaitingExecutor}
          />
          {!hasChatHistory && (
            <p
              className="text-lg font-semibold text-white/80"
              style={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 75
              }}
            >
              Give me any task and I will find agents who will do it for you…
            </p>
          )}
          <ChatInput
            onSubmit={workflow.sendMessage}
            disabled={workflow.streaming || workflow.awaitingExecutor}
            placeholder={
              workflow.awaitingExecutor
                ? 'We are preparing your job…'
                : 'Describe your task prompt...'
            }
          />
        </div>
        <div className="space-y-4">
          {workflow.task ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase text-white/50">Task Summary</p>
                <p className="text-lg font-semibold">{workflow.task.summary}</p>
              </div>
              {hasAgents ? (
                <BidTierSelection
                  bids={workflow.task.bid_spread}
                  selected={workflow.selectedTier}
                  completedMap={completionMap}
                  onSelect={handleBidSelect}
                  responses={bidResponses}
                  onResponseChange={handleBidFieldChange}
                  onClearSelection={workflow.clearSelectedTier}
                  executionState={executionState}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-white/20 p-6 text-sm text-white/70">
                  We are still finding available agents. Keep chatting while we source bids.
                </div>
              )}
              {showPaymentAction ? (
                <>
                  <button
                    type="button"
                    disabled={!canProceed}
                    onClick={workflow.openPayment}
                    className="w-full rounded-2xl bg-sky-500 py-3 text-center text-sm font-semibold disabled:opacity-40">
                    Proceed to Payment
                  </button>
                  {!canProceed && (
                    <p className="text-sm text-amber-300">
                      Answer the required questions for the {workflow.selectedTier?.id} bid before paying.
                    </p>
                  )}
                </>
              ) : hasAgents ? (
                <p className="text-sm text-white/70">
                  Select the agent you want to hire to unlock payment.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
      <PaymentSheet
        open={workflow.paymentSheetOpen}
        tier={workflow.selectedTier}
        taskId={workflow.task?.task_id}
        onClose={workflow.closePayment}
      />
      {workflow.task?.execution_result ? (
        <div className="space-y-4 md:col-span-2">
          <ExecutionResultCard result={workflow.task.execution_result} />
          <FeedbackSection
            feedback={workflow.task.feedback}
            submitting={workflow.ratingSubmitting}
            onSubmit={workflow.submitRating}
            onDispute={() => setDisputeOpen(true)}
          />
        </div>
      ) : null}
      <DisputePromptSheet
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        onSubmit={async (reason) => {
          if (!workflow.task?.task_id) return;
          const payload = { opened: true, reason, created_at: new Date().toISOString() };
          await tasksApi.dispute(workflow.task.task_id, payload);
          if (workflow.task) {
            setStoreTask({
              ...workflow.task,
              dispute: payload
            });
          }
        }}
      />
    </div>
  );
}
