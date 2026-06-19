import { NextResponse } from 'next/server'
import { listImageModels, imageConfigured } from '@/lib/image'

export const runtime = 'nodejs'

// Lists the image model menu (FLUX / fal, Higgsfield Soul) and which are
// usable in this environment based on configured provider keys.
export async function GET() {
  return NextResponse.json({
    success: true,
    configured: imageConfigured(),
    models: listImageModels(),
  })
}
