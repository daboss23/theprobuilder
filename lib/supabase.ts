import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Builder } from '@/types'

let anonClient: SupabaseClient | null = null
let adminClient: SupabaseClient | null = null

function requireUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
  return url
}

// Accept either the classic anon key or the newer publishable key name.
function anonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    ''
  )
}

// Accept either the classic service_role key or the newer secret key name.
function serviceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
}

// Anon/publishable client. Lazily constructed on first use.
export function getSupabase(): SupabaseClient {
  if (!anonClient) {
    anonClient = createClient(requireUrl(), anonKey())
  }
  return anonClient
}

// Service-role client - privileged, server side only. Lazily constructed.
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const key = serviceKey()
    if (!key) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
    }
    adminClient = createClient(requireUrl(), key)
  }
  return adminClient
}

/* -------------------------------------------------------------------------- */
/* Builders (tenants)                                                          */
/* -------------------------------------------------------------------------- */

export interface BuilderInsert {
  name: string
  website?: string | null
  region?: string | null
  brand_voice?: string | null
  serves?: string | null
  offer?: string | null
  proof_points?: string[] | null
  visual_style?: string | null
}

export async function createBuilder(input: BuilderInsert): Promise<Builder> {
  const { data, error } = await getSupabaseAdmin()
    .from('builders')
    .insert([input])
    .select()
    .single()

  if (error) throw error
  return data as Builder
}

export async function listBuilders(): Promise<Builder[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('builders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Builder[]
}

export async function getBuilder(id: string): Promise<Builder> {
  const { data, error } = await getSupabaseAdmin()
    .from('builders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Builder
}

/* -------------------------------------------------------------------------- */
/* Creative outputs                                                            */
/* -------------------------------------------------------------------------- */

export interface CreativeOutputInsert {
  builder_id: string | null
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
  const { data, error } = await getSupabaseAdmin()
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
