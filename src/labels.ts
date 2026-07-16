// Human-readable labels for the backend's enum values (pa_db's
// PARequestStatus/PARequestOutcome/ReviewMode/CriterionEvaluationStatus).
// Centralized so the same case is described the same way everywhere in the
// app, not just wherever it happens to be rendered.

export const STATUS_LABELS: Record<string, string> = {
  intake_received: 'New intake',
  evaluating: 'AI reviewing',
  pending_review: 'Awaiting staff review',
  approved: 'Approved',
  edited: 'Approved (edited)',
  overridden: 'Overridden by staff',
  submitted_ready: 'Ready to submit',
  closed: 'Closed',
}

export const OUTCOME_LABELS: Record<string, string> = {
  ready_to_submit: 'Meets requirements',
  gap_identified: 'Missing information',
  likely_not_coverable: 'Likely not covered',
}

export const REVIEW_MODE_LABELS: Record<string, string> = {
  auto_eligible: 'AI-confident — quick review',
  full_manual: 'Full manual review',
}

export const CRITERION_STATUS_LABELS: Record<string, string> = {
  met: 'Met',
  not_met: 'Not met',
  indeterminate: 'Needs human judgment',
}

/** Falls back to a plain underscore-to-space swap for any value not in the map. */
export function label(map: Record<string, string>, raw: string): string {
  return map[raw] ?? raw.replace(/_/g, ' ')
}
