// Minimal API client for the local demo. Reads the base URL from Vite env
// (falls back to the local backend) and attaches the stored access token.

const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export function getToken(): string | null {
  return localStorage.getItem('pa_token')
}

export function setToken(token: string, guest = false): void {
  localStorage.setItem('pa_token', token)
  if (guest) {
    localStorage.setItem('pa_token_is_guest', '1')
  } else {
    localStorage.removeItem('pa_token_is_guest')
  }
}

export function clearToken(): void {
  localStorage.removeItem('pa_token')
  localStorage.removeItem('pa_token_is_guest')
}

// Client-side hint only, purely for UI (hiding mutating buttons). The real
// enforcement is server-side -- every mutating endpoint rejects a guest
// token outright regardless of what the UI shows.
export function isGuest(): boolean {
  return localStorage.getItem('pa_token_is_guest') === '1'
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const resp = await fetch(`${BASE}${path}`, { ...init, headers })
  if (!resp.ok) {
    let detail = resp.statusText
    try {
      const body = await resp.json()
      detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail)
  }
  if (resp.status === 204) return undefined as T
  return resp.json() as Promise<T>
}

export interface RefLite {
  id: string
  name: string
}
export interface PayerPlan {
  id: string
  payer_name: string
  plan_name: string
}
export interface Diagnosis {
  id: string
  code: string
  label: string
}
export interface Reference {
  drugs: RefLite[]
  payer_plans: PayerPlan[]
  diagnoses: Diagnosis[]
}

export interface QueueItem {
  id: string
  status: string
  review_mode: string | null
  outcome: string | null
  created_at: string
  drug_name: string
  payer: string
  diagnosis_code: string | null
}

export interface Evaluation {
  id: string
  criterion: string
  requirement_type: string
  status: string
  confidence: number
  confidence_threshold: number
  citation: { document_id?: string; page?: number; quote?: string } | null
  explanation: string
  model_id: string
}

export interface RequestDetail {
  id: string
  status: string
  review_mode: string | null
  outcome: string | null
  drug_name: string
  payer: string
  diagnosis_code: string | null
  evaluations: Evaluation[]
}

export interface GapReason {
  description: string
  status: string
  c: number
}

export interface OperatorMetrics {
  total_pa_requests: number
  human_override_rate: number | null
  reviewed_count: number
  by_model: { model_id: string; count: number; avg_confidence: number }[]
  low_confidence_criteria: { description: string; count: number; avg_confidence: number }[]
}

export interface DashboardData {
  by_status: Record<string, number>
  by_outcome: Record<string, number>
  by_review_mode: Record<string, number>
  by_payer: Record<string, number>
  avg_ai_turnaround_minutes: number | null
  ai_turnaround_sample_size: number
  avg_human_review_minutes: number | null
  human_review_sample_size: number
  gap_denial_reasons: GapReason[]
  operator?: OperatorMetrics
}

export const api = {
  guestToken: () => request<{ access_token: string }>('/auth/guest-token', { method: 'POST' }),
  reference: () => request<Reference>('/reference'),
  queue: () => request<QueueItem[]>('/pa-requests'),
  detail: (id: string) => request<RequestDetail>(`/pa-requests/${id}`),
  createRequest: (drug_id: string, payer_plan_id: string, diagnosis_id: string) =>
    request<{ id: string }>('/pa-requests', {
      method: 'POST',
      body: JSON.stringify({ drug_id, payer_plan_id, diagnosis_id }),
    }),
  registerDocument: (paId: string, filename: string, mime_type: string) =>
    request<{ document_id: string; upload_url: string }>(
      `/pa-requests/${paId}/documents`,
      { method: 'POST', body: JSON.stringify({ filename, mime_type }) },
    ),
  evaluate: (id: string) =>
    request<{ status: string }>(`/pa-requests/${id}/evaluate`, {
      method: 'POST',
    }),
  review: (id: string, action: string, reason_note?: string, new_outcome?: string) =>
    request<{ new_status: string }>(`/pa-requests/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reason_note, new_outcome }),
    }),
  dashboard: () => request<DashboardData>('/dashboard'),
}

// Upload bytes straight to S3 via the presigned PUT URL (not through our API).
export async function uploadToS3(url: string, file: File): Promise<void> {
  const resp = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/pdf' },
    body: file,
  })
  if (!resp.ok) throw new Error(`S3 upload failed: ${resp.status}`)
}
