import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let anonClient: SupabaseClient | null = null
let adminClient: SupabaseClient | null = null

function requireUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
  return url
}

// Anon client — read operations. Lazily constructed on first use.
export function getSupabase(): SupabaseClient {
  if (!anonClient) {
    anonClient = createClient(requireUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '')
  }
  return anonClient
}

// Service-role client — write operations only (server side).
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
    }
    adminClient = createClient(requireUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY)
  }
  return adminClient
}

export interface CreativeOutputInsert {
  campaign_angle: string
  campaign_goal: string
  hooks: string[]
  body_copy: string[]
  ctas: string[]
  final_hook: string
  final_body: string
  final_cta: string
  image_prompt: string
  image_url_higgsfield: string | null
  image_url_openai: string | null
  copy_model: string
}

export async function saveCreativeOutput(output: CreativeOutputInsert) {
  const { data, error } = await getSupabaseAdmin()
    .from('creative_outputs')
    .insert([output])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getRecentOutputs(limit = 10) {
  const { data, error } = await getSupabase()
    .from('creative_outputs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function approveOutput(id: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('creative_outputs')
    .update({ approved: true, status: 'approved' })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
