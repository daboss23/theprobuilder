import { NextResponse } from 'next/server'
import { listVideoModels, videoConfigured } from '@/lib/video'

export const runtime = 'nodejs'

// Lists the video model menu (Seedance, Kling, Veo, Wan, Higgsfield) and which
// models are usable in this environment based on configured provider keys.
export async function GET() {
  const models = listVideoModels()
  return NextResponse.json({
    success: true,
    configured: videoConfigured(),
    models,
  })
}
