import { NextRequest, NextResponse } from 'next/server'
import { extractCreativeDNA, storeCreativeDNA } from '@/lib/spark'

export const runtime = 'nodejs'
export const maxDuration = 60

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Best-effort fetch of a creative's page text (Meta Ad Library / TikTok /
// YouTube / landing pages). Returns '' on any failure — the user can always
// paste the script/notes instead.
async function fetchUrlText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProBuilderBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return ''
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('text/html') && !ct.includes('text/plain')) return ''
    return stripHtml(await res.text()).slice(0, 8000)
  } catch {
    return ''
  }
}

// SPARK — study a winning creative and extract + store its Creative DNA.
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      text?: string
      url?: string
      platform?: string
      title?: string
      builderId?: string | null
    }

    let text = (body.text ?? '').trim()
    if (text.length < 40 && body.url?.trim()) {
      const fetched = await fetchUrlText(body.url.trim())
      text = `${text}\n${fetched}`.trim()
    }

    if (text.length < 40) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Not enough to analyze. Paste the ad script / transcript / notes, or provide a URL whose page text can be read.',
        },
        { status: 400 },
      )
    }

    const dna = await extractCreativeDNA(text)
    const stored = await storeCreativeDNA(
      dna,
      { url: body.url, platform: body.platform, title: body.title },
      body.builderId ?? null,
    )

    return NextResponse.json({ success: true, dna, stored: stored.stored, chunks: stored.chunks })
  } catch (err) {
    console.error('SPARK analyze error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 },
    )
  }
}
