import type { AspectRatio, JobStatus, VideoInput } from './types'

/**
 * fal.ai provider — a single gateway to the frontier video models (Seedance,
 * Kling, Veo, Wan). Uses fal's async queue API directly over fetch (no SDK
 * needed, works in a serverless route): submit returns a request id, which the
 * caller polls — video renders take minutes, longer than one function runs.
 *
 * Per project rules this NEVER throws on missing keys or failed renders — it
 * returns null / 'unknown' so the agent and copy stay usable.
 */

const QUEUE_BASE = 'https://queue.fal.run'

function falKey(): string | undefined {
  return process.env.FAL_KEY || process.env.FAL_API_KEY
}

export function falConfigured(): boolean {
  return Boolean(falKey())
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Key ${falKey()}`, 'Content-Type': 'application/json' }
}

/** Map fal's queue states onto our normalised lifecycle. */
function mapStatus(raw?: string): JobStatus {
  switch (raw) {
    case 'IN_QUEUE':
      return 'queued'
    case 'IN_PROGRESS':
      return 'in_progress'
    case 'COMPLETED':
      return 'completed'
    case 'FAILED':
    case 'ERROR':
      return 'failed'
    default:
      return 'unknown'
  }
}

/** Build the per-model input payload from our normalised VideoInput. */
function buildInput(input: VideoInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    prompt: input.prompt ?? '',
    aspect_ratio: input.aspectRatio ?? ('9:16' as AspectRatio),
  }
  if (input.durationSec) payload.duration = String(input.durationSec)
  if (input.mode === 'image-to-video' && input.imageUrl) {
    payload.image_url = input.imageUrl
  }
  // reference-to-video: pass up to 9 identity images so the model keeps the
  // same face/character consistent across the clip (the face-library path).
  if (input.mode === 'reference-to-video' && input.imageUrls?.length) {
    payload.image_urls = input.imageUrls.slice(0, 9)
  }
  return payload
}

export interface FalSubmitResult {
  requestId: string
  status: JobStatus
  /**
   * fal's authoritative result URL for this request (status lives at
   * `${responseUrl}/status`). Using it avoids guessing the base app path from
   * the endpoint, which is fragile for multi-segment model ids.
   */
  responseUrl: string | null
}

/** Submit a render to a fal model endpoint. Returns a request id to poll. */
export async function falSubmit(
  endpoint: string,
  input: VideoInput,
): Promise<FalSubmitResult | null> {
  if (!falConfigured()) return null
  try {
    const res = await fetch(`${QUEUE_BASE}/${endpoint}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(buildInput(input)),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('fal submit failed:', res.status, await res.text())
      return null
    }
    const data = (await res.json()) as {
      request_id?: string
      status?: string
      response_url?: string
    }
    if (!data.request_id) return null
    return {
      requestId: data.request_id,
      status: mapStatus(data.status) || 'queued',
      responseUrl: data.response_url ?? null,
    }
  } catch (err) {
    console.error('fal submit error:', err)
    return null
  }
}

export interface FalStatusResult {
  status: JobStatus
  videoUrl: string | null
}

/** Resolve the result URL for a request: prefer fal's authoritative
 * response_url; otherwise reconstruct from the endpoint's base app namespace. */
function resultUrlFor(endpoint: string, requestId: string, responseUrl?: string | null): string {
  if (responseUrl) return responseUrl
  const base = endpoint.split('/').slice(0, 2).join('/')
  return `${QUEUE_BASE}/${base}/requests/${encodeURIComponent(requestId)}`
}

/**
 * Poll a render. Uses fal's authoritative response_url when known (status is at
 * `${responseUrl}/status`), falling back to the base-namespace reconstruction.
 */
export async function falStatus(
  endpoint: string,
  requestId: string,
  responseUrl?: string | null,
): Promise<FalStatusResult> {
  if (!falConfigured() || !requestId) return { status: 'unknown', videoUrl: null }
  const resultUrl = resultUrlFor(endpoint, requestId, responseUrl)
  try {
    const statusRes = await fetch(`${resultUrl}/status`, {
      headers: authHeaders(),
      cache: 'no-store',
    })
    if (!statusRes.ok) return { status: 'unknown', videoUrl: null }
    const statusData = (await statusRes.json()) as { status?: string }
    const status = mapStatus(statusData.status)
    if (status !== 'completed') return { status, videoUrl: null }

    // Completed — fetch the result payload for the video URL.
    const resultRes = await fetch(resultUrl, { headers: authHeaders(), cache: 'no-store' })
    if (!resultRes.ok) return { status: 'completed', videoUrl: null }
    const result = (await resultRes.json()) as {
      video?: { url?: string }
      videos?: { url?: string }[]
    }
    const url = result.video?.url ?? result.videos?.[0]?.url ?? null
    return { status: 'completed', videoUrl: url }
  } catch (err) {
    console.error('fal status error:', err)
    return { status: 'unknown', videoUrl: null }
  }
}
