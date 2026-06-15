import type { VideoModel } from './types'

/**
 * The model menu — TPB's in-house equivalent of Higgsfield's model picker.
 *
 * fal.ai is used as a single gateway for the frontier models (Seedance, Kling,
 * Veo, Wan): one key (FAL_KEY) unlocks all of them with one async pattern.
 * Higgsfield stays wired through its own platform API.
 *
 * Provider model paths drift as vendors ship new versions, so every endpoint
 * can be overridden with an env var without code changes. The defaults reflect
 * the current generation; update them (or set the env var) as models evolve.
 */

const env = (key: string, fallback: string) => process.env[key] || fallback

export const VIDEO_MODELS: VideoModel[] = [
  {
    id: 'seedance-2.0',
    label: 'Seedance 2.0 (ByteDance)',
    provider: 'fal',
    endpoints: {
      'text-to-video': env('FAL_SEEDANCE_T2V', 'fal-ai/bytedance/seedance/v1/pro/text-to-video'),
      'image-to-video': env('FAL_SEEDANCE_I2V', 'fal-ai/bytedance/seedance/v1/pro/image-to-video'),
    },
    modes: ['text-to-video', 'image-to-video'],
    maxDurationSec: 10,
    aspectRatios: ['1:1', '9:16', '16:9'],
    audio: false,
    tier: 'flagship',
    notes: 'Cinematic realism and strong motion — flagship for B-roll and human scenes.',
  },
  {
    id: 'kling-2.5',
    label: 'Kling 2.5 (Kuaishou)',
    provider: 'fal',
    endpoints: {
      'text-to-video': env('FAL_KLING_T2V', 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video'),
      'image-to-video': env('FAL_KLING_I2V', 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video'),
    },
    modes: ['text-to-video', 'image-to-video'],
    maxDurationSec: 10,
    aspectRatios: ['1:1', '9:16', '16:9'],
    audio: false,
    tier: 'flagship',
    notes: 'Excellent prompt adherence and lip-sync-friendly motion for UGC.',
  },
  {
    id: 'veo-3',
    label: 'Veo 3 (Google)',
    provider: 'fal',
    endpoints: {
      'text-to-video': env('FAL_VEO3_T2V', 'fal-ai/veo3'),
      'image-to-video': env('FAL_VEO3_I2V', 'fal-ai/veo3/image-to-video'),
    },
    modes: ['text-to-video', 'image-to-video'],
    maxDurationSec: 8,
    aspectRatios: ['9:16', '16:9'],
    audio: true,
    tier: 'flagship',
    notes: 'Native synchronized audio + dialogue — best for people speaking / UGC voices.',
  },
  {
    id: 'wan-2.5',
    label: 'Wan 2.5 (Alibaba)',
    provider: 'fal',
    endpoints: {
      'text-to-video': env('FAL_WAN_T2V', 'fal-ai/wan-25-preview/text-to-video'),
      'image-to-video': env('FAL_WAN_I2V', 'fal-ai/wan-25-preview/image-to-video'),
    },
    modes: ['text-to-video', 'image-to-video'],
    maxDurationSec: 10,
    aspectRatios: ['1:1', '9:16', '16:9'],
    audio: false,
    tier: 'budget',
    notes: 'Strong quality-to-cost ratio for high-volume variant generation.',
  },
  {
    id: 'higgsfield-dop',
    label: 'Higgsfield DoP',
    provider: 'higgsfield',
    endpoints: {
      'image-to-video': 'dop',
    },
    modes: ['image-to-video'],
    maxDurationSec: 5,
    aspectRatios: ['1:1', '9:16', '16:9'],
    audio: false,
    tier: 'fast',
    notes: 'Cinematic camera-move animation of a still — already wired via the Higgsfield SDK.',
  },
]

/** Default model when the caller does not specify one. */
export const DEFAULT_VIDEO_MODEL = 'seedance-2.0'

export function getVideoModel(id: string): VideoModel | undefined {
  return VIDEO_MODELS.find((m) => m.id === id)
}
