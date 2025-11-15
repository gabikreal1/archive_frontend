export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-white/60">
      <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400 delay-150" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400 delay-300" />
      <span>Agent thinking…</span>
    </div>
  );
}
