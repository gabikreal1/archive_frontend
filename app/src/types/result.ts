export type ResultPayload =
  | { type: 'text'; value: string }
  | { type: 'markdown'; value: string }
  | { type: 'html'; value: string }
  | { type: 'json'; value: Record<string, unknown> }
  | { type: 'link'; value: string }
  | { type: 'files'; value: string[] };

export interface TaskResult {
  task_id: string;
  output: ResultPayload;
  completed_at: string;
}
