import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getBrandMemory } from '@/lib/brand-memory'
import { getSkills } from '@/lib/skills'
import { parseModelJson } from '@/lib/parse'
import type { CopyOutput } from '@/types'

export const runtime = 'nodejs'

// Comparison copy generator. Kept structurally identical to the Claude route
// so the two outputs can be evaluated side by side from the same brief.
const OPENAI_COPY_MODEL = 'gpt-5.5-2026-04-23'

export async function POST(request: NextRequest) {
  try {
    const openai = getOpenAI()

    const { brief } = await request.json()
    const brandMemory = getBrandMemory()
    const skills = getSkills(['meta-frameworks', 'hooks-library'])

    const systemPrompt = `${brandMemory}

---

## YOUR CREATIVE SKILLS & FRAMEWORKS
${skills}

---

You are the AI Creative System for Summit Build Co.
Respond ONLY with valid JSON. No preamble, no markdown fences. Pure JSON.

Output this exact structure:
{
  "hooks": ["hook1", "hook2", "hook3", "hook4", "hook5"],
  "bodyVariants": ["body1", "body2", "body3"],
  "ctas": ["cta1", "cta2", "cta3"],
  "finalHook": "strongest hook",
  "finalBody": "strongest body",
  "finalCta": "strongest CTA",
  "imagePrompt": "image-generation prompt matching the campaign angle and Summit Build Co visual style"
}`

    const completion = await openai.chat.completions.create({
      model: OPENAI_COPY_MODEL,
      max_completion_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate Meta ad copy for Summit Build Co.
Campaign Angle: ${brief.angle}
Campaign Goal: ${brief.goal}

Make every line specific to Summit Build Co — never generic.`,
        },
      ],
    })

    const responseText = completion.choices[0]?.message?.content || ''
    const copyData = parseModelJson<CopyOutput>(responseText)

    return NextResponse.json({ success: true, data: copyData, model: 'openai' })
  } catch (error) {
    console.error('OpenAI copy generation error:', error)
    return NextResponse.json(
      { success: false, error: 'OpenAI copy generation failed' },
      { status: 500 }
    )
  }
}
