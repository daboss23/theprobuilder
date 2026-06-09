import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getBrandMemory } from '@/lib/brand-memory'
import { getSkills } from '@/lib/skills'
import { parseModelJson } from '@/lib/parse'
import type { CopyOutput } from '@/types'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const { brief } = await request.json()
    const brandMemory = getBrandMemory()
    const skills = getSkills(['meta-frameworks', 'hooks-library'])

    const systemPrompt = `${brandMemory}

---

## YOUR CREATIVE SKILLS & FRAMEWORKS
${skills}

---

You are the AI Creative System for Summit Build Co. You have just read your
brand memory and creative frameworks above.

Your task is to generate Meta ad copy for the campaign brief you receive.

CRITICAL OUTPUT RULE: Respond ONLY with valid JSON. No preamble, no
explanation, no markdown code fences. Pure JSON only.

Output this exact JSON structure:
{
  "hooks": ["hook1", "hook2", "hook3", "hook4", "hook5"],
  "bodyVariants": ["body1 (under 150 words)", "body2 (under 150 words)", "body3 (under 150 words)"],
  "ctas": ["cta1", "cta2", "cta3"],
  "finalHook": "the strongest hook",
  "finalBody": "the strongest body copy",
  "finalCta": "the strongest CTA",
  "imagePrompt": "A detailed image-generation prompt that matches this campaign angle and follows the Summit Build Co visual style guide from your brand memory"
}`

    const userMessage = `Generate Meta ad copy for Summit Build Co with this campaign brief:

Campaign Angle: ${brief.angle}
Campaign Goal: ${brief.goal}

Apply the brand voice, hook frameworks and creative guidelines from your brand
memory. Make every line specific to Summit Build Co — it should be impossible
to swap the brand name out and use this for any other builder.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const block = message.content[0]
    const responseText = block && block.type === 'text' ? block.text : ''
    const copyData = parseModelJson<CopyOutput>(responseText)

    return NextResponse.json({ success: true, data: copyData, model: 'claude' })
  } catch (error) {
    console.error('Copy generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate copy' },
      { status: 500 }
    )
  }
}
