"use client";

import clsx from 'clsx';
import type { TaskDetails, TaskStatus } from '@/types/task';

interface TaskSidebarProps {
  open: boolean;
  tasks: TaskDetails[];
  onClose: () => void;
}

const STATUS_META: Record<TaskStatus, { label: string; badge: string }> = {
  draft: { label: 'Pending', badge: 'bg-white/10 text-white' },
  awaiting_bid_selection: { label: 'Pending', badge: 'bg-amber-500/20 text-amber-200' },
  awaiting_payment: { label: 'Waiting for payment', badge: 'bg-sky-500/20 text-sky-200' },
  executing: { label: 'Pending', badge: 'bg-purple-500/20 text-purple-100' },
  result_ready: { label: 'Completed', badge: 'bg-emerald-500/20 text-emerald-100' },
  on_review: { label: 'Pending review', badge: 'bg-rose-500/20 text-rose-100' }
};

function getStatusMeta(status: TaskStatus) {
  return STATUS_META[status] ?? { label: 'Pending', badge: 'bg-white/10 text-white' };
}

export function TaskSidebar({ open, tasks, onClose }: TaskSidebarProps) {
  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />
      <aside
        className={clsx(
          'fixed left-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col gap-6 bg-slate-900/95 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-hidden={!open}
        aria-label="Task history"
      >
        <div className="flex items-center justify-between text-white">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Task history</p>
            <h2 className="text-lg font-semibold">Your requests</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 transition hover:border-white/40 hover:text-white"
          >
            Close
          </button>
        </div>
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/20 p-4 text-sm text-white/70">
            You haven’t created any tasks yet. Submit a prompt to see it listed here.
          </div>
        ) : (
          <ul className="flex-1 space-y-3 overflow-y-auto pr-1">
            {tasks.map((task) => {
              const { label, badge } = getStatusMeta(task.status);
              return (
                <li
                  key={task.task_id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 text-left"
                >
                  <p className="text-sm font-medium text-white">
                    {task.summary || 'Untitled task'}
                  </p>
                  <p className="text-xs text-white/60">ID: {task.task_id}</p>
                  <span className={`mt-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badge}`}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </>
  );
}
