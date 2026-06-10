import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Builder, Framework, FrameworkInsert, FrameworkUpdate } from '@/types'

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

/* -------------------------------------------------------------------------- */
/* Frameworks library (P2)                                                     */
/* -------------------------------------------------------------------------- */

export interface ListFrameworksOptions {
  category?: string
  // 'all' = everything, 'global' = builder_id IS NULL, string uuid = exact builder only
  builderScope?: 'all' | 'global' | string
}

export async function listFrameworks(opts: ListFrameworksOptions = {}): Promise<Framework[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = getSupabaseAdmin()
    .from('frameworks')
    .select('*')
    .order('category', { ascending: true })
    .order('created_at', { ascending: true })

  if (opts.category) {
    query = query.eq('category', opts.category)
  }

  const scope = opts.builderScope ?? 'all'
  if (scope === 'all') {
    // No filter
  } else if (scope === 'global') {
    query = query.is('builder_id', null)
  } else {
    query = query.eq('builder_id', scope)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Framework[]
}

// For generation: returns global frameworks + builder-specific if builderId provided.
export async function getFrameworksForBuilder(builderId: string | null): Promise<Framework[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = getSupabaseAdmin()
    .from('frameworks')
    .select('*')
    .order('category', { ascending: true })
    .order('created_at', { ascending: true })

  if (builderId) {
    query = query.or(`builder_id.is.null,builder_id.eq.${builderId}`)
  } else {
    query = query.is('builder_id', null)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Framework[]
}

export async function createFramework(input: FrameworkInsert): Promise<Framework> {
  const { data, error } = await getSupabaseAdmin()
    .from('frameworks')
    .insert([input])
    .select()
    .single()

  if (error) throw error
  return data as Framework
}

export async function updateFramework(id: string, updates: FrameworkUpdate): Promise<Framework> {
  const { data, error } = await getSupabaseAdmin()
    .from('frameworks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Framework
}

export async function deleteFramework(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('frameworks')
    .delete()
    .eq('id', id)

  if (error) throw error
}
