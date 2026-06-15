import { randomUUID } from 'crypto'
import { getSupabaseAdmin, supabaseUrl } from './supabase'

/**
 * Face / character roster — the in-house UGC asset library. Saved reference
 * assets (images / short videos) live in the public Supabase Storage bucket
 * 'faces'; their public URLs are passed to Seedance 2.0 reference-to-video so a
 * character stays consistent across generated clips.
 *
 * Reads degrade gracefully when Supabase isn't configured (callers fall back to
 * an empty roster). Writes surface errors clearly, per project rules.
 */

const BUCKET = process.env.FACES_BUCKET || 'faces'

export type FaceKind = 'image' | 'video'

export interface Face {
  id: string
  created_at: string
  builder_id: string | null
  name: string
  kind: FaceKind
  url: string
  storage_path: string | null
}

function serviceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
}

/** True when Supabase (URL + service role key) is configured for storage + DB. */
export function facesConfigured(): boolean {
  return Boolean(supabaseUrl() && serviceKey())
}

/** Best-effort: ensure the public 'faces' bucket exists. Ignores "already
 * exists"; a genuine failure surfaces later on upload. */
async function ensureBucket(): Promise<void> {
  try {
    await getSupabaseAdmin().storage.createBucket(BUCKET, { public: true })
  } catch {
    /* bucket likely already exists — ignore */
  }
}

/** List the saved roster, newest first. */
export async function listFaces(): Promise<Face[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('faces')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Face[]
}

export interface UploadFaceInput {
  name: string
  kind: FaceKind
  bytes: Buffer
  contentType: string
  ext: string
  builderId?: string | null
}

/** Upload a reference asset to Storage and save it to the roster. */
export async function uploadFace(input: UploadFaceInput): Promise<Face> {
  await ensureBucket()
  const admin = getSupabaseAdmin()
  const path = `${randomUUID()}.${input.ext.replace(/[^a-z0-9]/gi, '') || 'bin'}`

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, input.bytes, { contentType: input.contentType, upsert: false })
  if (upErr) throw upErr

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
  const { data, error } = await admin
    .from('faces')
    .insert([
      {
        name: input.name,
        kind: input.kind,
        url: pub.publicUrl,
        storage_path: path,
        builder_id: input.builderId ?? null,
      },
    ])
    .select()
    .single()
  if (error) throw error
  return data as Face
}

/** Remove a roster entry and its Storage object. */
export async function deleteFace(id: string): Promise<void> {
  const admin = getSupabaseAdmin()
  const { data } = await admin.from('faces').select('storage_path').eq('id', id).single()
  const path = (data as { storage_path?: string } | null)?.storage_path
  if (path) {
    await admin.storage.from(BUCKET).remove([path])
  }
  const { error } = await admin.from('faces').delete().eq('id', id)
  if (error) throw error
}
