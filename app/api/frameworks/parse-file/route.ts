import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'md' || ext === 'txt') {
      const text = await file.text()
      const content = text.trim()
      if (!content) {
        return NextResponse.json({ success: false, error: 'File is empty' }, { status: 400 })
      }
      return NextResponse.json({ success: true, content })
    }

    if (ext === 'pdf') {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // require inside the function body defers module load until runtime,
      // avoiding pdf-parse's worker initialisation at build time.
      // pdf-parse v2 exports a PDFParse class (the v1 callable default is gone).
      const { PDFParse } = require('pdf-parse') as {
        PDFParse: new (opts: { data: Buffer }) => { getText(): Promise<{ text: string }> }
      } // eslint-disable-line
      const parser = new PDFParse({ data: buffer })
      const data = await parser.getText()

      const content = data.text
        .replace(/\n{3,}/g, '\n\n')
        .trim()

      if (!content || content.length < 10) {
        return NextResponse.json(
          { success: false, error: 'Could not extract text from this PDF' },
          { status: 400 }
        )
      }

      const trimmed =
        content.length > 8000
          ? content.slice(0, 8000) + '\n\n[content truncated at 8000 chars]'
          : content

      return NextResponse.json({ success: true, content: trimmed })
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported file type. Use .md, .txt, or .pdf' },
      { status: 400 }
    )
  } catch (error) {
    console.error('File parse error:', error)
    const detail = error instanceof Error ? error.message : ''
    const message = detail
      ? `Couldn't read this file — ${detail}. Try a .md or .txt export instead.`
      : "Couldn't read this file. Try a .md or .txt export instead."
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
