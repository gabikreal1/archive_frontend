import type { JobExecutionOutput } from '@/types/task';

interface ExecutionResultCardProps {
  result: JobExecutionOutput;
}

export function ExecutionResultCard({ result }: ExecutionResultCardProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-white/50">Delivery ready</p>
        <p className="mt-1 text-lg font-semibold">Final output</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-white/70">Deliverable</p>
        <p className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-white">
          {result.deliverable}
        </p>
      </div>
      {result.keyFindings?.length ? (
        <div>
          <p className="text-sm font-semibold text-white/70">Key findings</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/80">
            {result.keyFindings.map((finding) => (
              <li key={finding}>{finding}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.methodology ? (
        <div>
          <p className="text-sm font-semibold text-white/70">Methodology</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">{result.methodology}</p>
        </div>
      ) : null}
      {result.cautions?.length ? (
        <div>
          <p className="text-sm font-semibold text-white/70">Cautions</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-200">
            {result.cautions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-4 text-xs uppercase tracking-wide text-white/50">
        {typeof result.estimatedHours === 'number' ? <span>Hours: {result.estimatedHours}</span> : null}
        {result.raw ? <span>Raw data attached</span> : null}
      </div>
    </div>
  );
}
