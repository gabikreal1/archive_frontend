import type { AutopilotBidCandidate, AutopilotTier, BidTierSuggestion, TaskDetails } from '@/types/task';

export type JobStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED';

export interface JobBid {
  id: string;
  jobId: string;
  bidderWallet: string;
  price: string;
  deliveryTime: string;
  reputation: string;
  accepted: boolean;
  createdAt: string;
}

export interface JobResponse {
  id: string;
  posterWallet: string;
  description: string;
  tags: string[];
  deadline: string | null;
  status: JobStatus;
  createdAt: string;
  bids?: JobBid[];
}

const STATUS_MAP: Record<JobStatus, TaskDetails['status']> = {
  OPEN: 'awaiting_bid_selection',
  IN_PROGRESS: 'executing',
  COMPLETED: 'result_ready',
  DISPUTED: 'on_review'
};

const TIER_LABELS = ['economy', 'balanced', 'premium'];

function resolveTierLabel(tierHint?: AutopilotTier, fallback?: string) {
  if (tierHint === 'PREMIUM') return 'premium';
  if (tierHint === 'ECONOMY') return 'economy';
  return fallback ?? 'tier';
}

export function mapBidResponse(bid: JobBid, index: number): BidTierSuggestion {
  return {
    id: TIER_LABELS[index] ?? `tier-${index + 1}`,
    backend_bid_id: bid.id,
    price_usdc: Number(bid.price ?? 0).toFixed(2),
    time_estimate_min: Math.max(1, Math.round(Number(bid.deliveryTime ?? 0) / 60)),
    agent_trust_stars: Number(bid.reputation ?? 3) || 3,
    description: bid.bidderWallet,
    required_fields: []
  };
}

export function mapAutopilotCandidate(candidate: AutopilotBidCandidate, explicitTier?: 'premium' | 'economy'): BidTierSuggestion {
  const tierId = explicitTier ?? resolveTierLabel(candidate.tierHint, candidate.id);
  const safeEta = Number.isFinite(candidate.etaMinutes) ? candidate.etaMinutes : 0;
  const confidence = Number.isFinite(candidate.confidence) ? candidate.confidence : 0.6;
  return {
    id: tierId,
    backend_bid_id: candidate.id,
    price_usdc: Number(candidate.priceUsd ?? 0).toFixed(2),
    time_estimate_min: Math.max(1, Math.round(safeEta)),
    agent_trust_stars: Math.min(5, Math.max(1, Math.round(confidence * 5))),
    agent_id: candidate.agentId,
    description: candidate.agentName ?? candidate.summary,
    tier_hint: candidate.tierHint,
    autopilot_candidate_id: candidate.id,
    autopilot_summary: candidate.summary,
    autopilot_reasoning: candidate.reasoning,
    required_fields: []
  };
}

export function mapJobResponse(
  job: JobResponse,
  extras?: Partial<Pick<TaskDetails, 'feedback' | 'dispute'>>
): TaskDetails {
  const bids = Array.isArray(job.bids) ? job.bids : [];
  const bid_spread = bids.map(mapBidResponse);
  const acceptedId = bids.find((bid) => bid.accepted)?.id;
  const selected_tier = acceptedId
    ? bid_spread.find((bid) => bid.backend_bid_id === acceptedId)
    : undefined;

  return {
    task_id: job.id,
    summary: job.description,
    bid_spread,
    status: STATUS_MAP[job.status] ?? 'awaiting_bid_selection',
    selected_tier,
    locked_price_usdc: selected_tier?.price_usdc,
    ...extras
  };
}
