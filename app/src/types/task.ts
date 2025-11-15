export interface BidTierSuggestion {
  id: string;
  backend_bid_id?: string;
  price_usdc: string;
  time_estimate_min: number;
  agent_trust_stars: number;
  agent_id?: string;
  description?: string;
  required_fields?: string[];
}

export interface CreatedTaskResponse {
  task_id: string;
  summary: string;
  bid_spread: BidTierSuggestion[];
}

export type TaskStatus =
  | 'draft'
  | 'awaiting_bid_selection'
  | 'awaiting_payment'
  | 'executing'
  | 'result_ready'
  | 'on_review';

export interface TaskFeedback {
  rating: number;
  comment?: string;
}

export interface TaskDispute {
  opened: boolean;
  reason?: string;
  created_at?: string;
}

export interface TaskDetails extends CreatedTaskResponse {
  status: TaskStatus;
  selected_tier?: BidTierSuggestion;
  locked_price_usdc?: string;
  feedback?: TaskFeedback;
  dispute?: TaskDispute;
}
