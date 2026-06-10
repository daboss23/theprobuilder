import { NextRequest, NextResponse } from 'next/server'
import { updateFramework, deleteFramework } from '@/lib/supabase'
import type { FrameworkUpdate } from '@/types'

export const runtime = 'nodejs'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as FrameworkUpdate
    const updated = await updateFramework(params.id, body)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update framework error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update framework' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteFramework(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete framework error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete framework' },
      { status: 500 }
    )
  }
}
