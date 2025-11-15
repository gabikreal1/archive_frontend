import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ResultPayload } from '@/types/result';

interface ResultRendererProps {
  payload: ResultPayload;
}

export function ResultRenderer({ payload }: ResultRendererProps) {
  switch (payload.type) {
    case 'text':
      return <p className="whitespace-pre-wrap text-base leading-relaxed">{payload.value}</p>;
    case 'markdown':
      return (
        <ReactMarkdown className="prose prose-invert max-w-none" remarkPlugins={[remarkGfm]}>
          {payload.value}
        </ReactMarkdown>
      );
    case 'html':
      return (
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: payload.value }}
        />
      );
    case 'json':
      return (
        <pre className="overflow-x-auto rounded-lg bg-black/40 p-4 text-xs">
          {JSON.stringify(payload.value, null, 2)}
        </pre>
      );
    case 'link':
      return (
        <a href={payload.value} className="text-sky-400 underline" target="_blank" rel="noreferrer">
          {payload.value}
        </a>
      );
    case 'files':
      return (
        <ul className="space-y-2 text-sm">
          {payload.value.map((file) => (
            <li key={file}>
              <a
                href={file}
                className="text-sky-300 underline"
                target="_blank"
                rel="noreferrer"
              >
                {file}
              </a>
            </li>
          ))}
        </ul>
      );
    default:
      return <p className="text-sm text-white/60">Unsupported result format.</p>;
  }
}
