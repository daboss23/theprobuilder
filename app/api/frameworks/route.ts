import { NextRequest, NextResponse } from 'next/server'
import { listFrameworks, createFramework } from '@/lib/supabase'
import type { FrameworkInsert } from '@/types'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const builderScope = (searchParams.get('builderScope') as 'all' | 'global' | string) || 'all'

    const frameworks = await listFrameworks({ category, builderScope })
    return NextResponse.json({ success: true, data: frameworks })
  } catch (error) {
    console.error('List frameworks error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list frameworks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FrameworkInsert

    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }
    if (!body.category) {
      return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 })
    }
    if (!body.content?.trim()) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 })
    }

    const tags =
      body.tags && body.tags.length > 0
        ? body.tags.map((t) => t.trim()).filter(Boolean)
        : null

    const framework = await createFramework({
      title: body.title.trim(),
      category: body.category,
      content: body.content.trim(),
      builder_id: body.builder_id ?? null,
      tags,
    })

    return NextResponse.json({ success: true, data: framework })
  } catch (error) {
    console.error('Create framework error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create framework' },
      { status: 500 }
    )
  }
}
