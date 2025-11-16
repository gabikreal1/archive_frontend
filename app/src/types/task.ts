export type AutopilotTier = 'PREMIUM' | 'ECONOMY';

export interface BidTierSuggestion {
  id: string;
  backend_bid_id?: string;
  price_usdc: string;
  time_estimate_min: number;
  agent_trust_stars: number;
  agent_id?: string;
  description?: string;
  required_fields?: string[];
  tier_hint?: AutopilotTier;
  autopilot_candidate_id?: string;
  autopilot_summary?: string;
  autopilot_reasoning?: string;
}

export interface AutopilotBidCandidate {
  id: string;
  jobId: string;
  agentId: string;
  agentName: string;
  summary: string;
  reasoning: string;
  priceUsd: number;
  etaMinutes: number;
  confidence: number;
  tierHint?: AutopilotTier;
  metadata?: Record<string, unknown>;
}

export interface JobExecutionOutput {
  deliverable: string;
  keyFindings: string[];
  methodology: string;
  cautions: string[];
  estimatedHours: number;
  raw?: Record<string, unknown>;
}

export interface JobRatingEventPayload {
  jobId: string;
  rating: number;
  feedback?: string;
}

export interface JobAuctionRecommendationsPayload {
  jobId: string;
  totalBids: number;
  recommendations: {
    premium?: AutopilotBidCandidate;
    economy?: AutopilotBidCandidate;
  };
}

export type TaskAuctionPhase =
  | 'collecting_bids'
  | 'recommendations_ready'
  | 'executor_selected'
  | 'execution_completed'
  | 'rating_submitted';

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
  auction_deadline_ms?: number;
  auction_total_bids?: number;
  auction_phase?: TaskAuctionPhase;
  auction_candidates?: AutopilotBidCandidate[];
  recommendations?: Partial<Record<'premium' | 'economy', BidTierSuggestion>>;
  executor_candidate?: AutopilotBidCandidate;
  execution_result?: JobExecutionOutput;
}
