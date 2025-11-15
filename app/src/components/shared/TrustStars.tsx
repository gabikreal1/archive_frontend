interface TrustStarsProps {
  value: number;
}

export function TrustStars({ value }: TrustStarsProps) {
  return (
    <div className="flex gap-1 text-amber-300">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index}>{value >= index + 1 ? '★' : '☆'}</span>
      ))}
      <span className="text-xs text-white/60">{value.toFixed(1)}</span>
    </div>
  );
}
