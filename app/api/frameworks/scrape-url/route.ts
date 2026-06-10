import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    if (!url?.trim()) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProBuilderBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch URL (${res.status})` },
        { status: 400 }
      )
    }

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return NextResponse.json(
        { success: false, error: 'URL must point to a webpage or plain text file' },
        { status: 400 }
      )
    }

    const html = await res.text()
    const text = stripHtml(html)

    if (!text || text.length < 50) {
      return NextResponse.json(
        { success: false, error: 'Could not extract meaningful content from this URL' },
        { status: 400 }
      )
    }

    const content =
      text.length > 8000 ? text.slice(0, 8000) + '\n\n[content truncated at 8000 chars]' : text

    return NextResponse.json({ success: true, content })
  } catch (error) {
    console.error('URL scrape error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch URL. Check the address and try again.' },
      { status: 500 }
    )
  }
}
