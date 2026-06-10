export interface CampaignBrief {
  angle: string
  goal: string
}

export type CopyModel = 'claude' | 'openai'

export interface CopyOutput {
  hooks: string[]
  bodyVariants: string[]
  ctas: string[]
  finalHook: string
  finalBody: string
  finalCta: string
  imagePrompt: string
}

export type ImageProvider = 'higgsfield' | 'openai'
export type ImageStatus = 'idle' | 'generating' | 'complete' | 'error'

export interface ImageResult {
  provider: ImageProvider
  prompt: string
  imageUrl: string | null
  status: ImageStatus
}

export interface GenerateCopyResponse {
  success: boolean
  data?: CopyOutput
  model?: CopyModel
  error?: string
}

export interface GenerateImageResponse {
  success: boolean
  imageUrl?: string | null
  error?: string
}

// A building company onboarded into the platform (multi-tenant).
export interface Builder {
  id: string
  created_at?: string
  name: string
  website: string | null
  region: string | null
  brand_voice: string | null
  serves: string | null
  offer: string | null
  proof_points: string[] | null
  visual_style: string | null
  status: string
}

export interface CreativeRecord {
  id: string
  created_at: string
  builder_id: string | null
  campaign_angle: string
  campaign_goal: string
  hooks: string[]
  body_copy: string[]
  ctas: string[]
  final_hook: string | null
  final_body: string | null
  final_cta: string | null
  image_prompt: string | null
  image_url_higgsfield: string | null
  image_url_openai: string | null
  copy_model: string
  status: string
  approved: boolean
}

// P2: Frameworks library
export type FrameworkCategory = 'copy' | 'hook' | 'image' | 'video'

export interface Framework {
  id: string
  created_at?: string
  title: string
  category: FrameworkCategory
  content: string
  builder_id: string | null
  tags: string[] | null
}

export interface FrameworkInsert {
  title: string
  category: FrameworkCategory
  content: string
  builder_id?: string | null
  tags?: string[] | null
}

export interface FrameworkUpdate {
  title?: string
  category?: FrameworkCategory
  content?: string
  builder_id?: string | null
  tags?: string[] | null
}
