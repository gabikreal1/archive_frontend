"use client";

const actions = [
  { emoji: '📌', label: 'Use as Task Definition' },
  { emoji: '➕', label: 'Add Context' },
  { emoji: '🔁', label: 'Regenerate' },
  { emoji: '❓', label: 'Clarify' }
];

export function MessageActions() {
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 hover:border-sky-500"
        >
          <span>{action.emoji}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
