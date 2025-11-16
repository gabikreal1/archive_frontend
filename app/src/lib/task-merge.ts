import type { TaskDetails } from '@/types/task';

function hasLength<T>(list?: T[]) {
  return Array.isArray(list) && list.length > 0;
}

/**
 * Merge freshly fetched task data with existing realtime state without losing auction metadata.
 */
export function mergeTaskDetails(
  existing: TaskDetails | undefined,
  incoming: TaskDetails,
  overrides?: Partial<TaskDetails>
): TaskDetails {
  const merged: TaskDetails = {
    ...(existing ?? {}),
    ...incoming
  };

  if (!hasLength(incoming.bid_spread) && hasLength(existing?.bid_spread)) {
    merged.bid_spread = existing!.bid_spread;
  }

  if (!incoming.selected_tier && existing?.selected_tier) {
    merged.selected_tier = existing.selected_tier;
  }

  if (typeof incoming.locked_price_usdc === 'undefined' && typeof existing?.locked_price_usdc !== 'undefined') {
    merged.locked_price_usdc = existing.locked_price_usdc;
  }

  if (!incoming.recommendations && existing?.recommendations) {
    merged.recommendations = existing.recommendations;
  }

  if (!hasLength(incoming.auction_candidates) && hasLength(existing?.auction_candidates)) {
    merged.auction_candidates = existing!.auction_candidates;
  }

  if (typeof incoming.auction_deadline_ms === 'undefined' && typeof existing?.auction_deadline_ms !== 'undefined') {
    merged.auction_deadline_ms = existing.auction_deadline_ms;
  }

  if (typeof incoming.auction_total_bids === 'undefined' && typeof existing?.auction_total_bids !== 'undefined') {
    merged.auction_total_bids = existing.auction_total_bids;
  }

  if (!incoming.auction_phase && existing?.auction_phase) {
    merged.auction_phase = existing.auction_phase;
  }

  if (!incoming.executor_candidate && existing?.executor_candidate) {
    merged.executor_candidate = existing.executor_candidate;
  }

  if (!incoming.execution_result && existing?.execution_result) {
    merged.execution_result = existing.execution_result;
  }

  if (overrides) {
    Object.assign(merged, overrides);
  }

  return merged;
}
