-- Platform schema: multi-tenant agency -> builders.
-- Draft for the Builder Growth Engine (see SYSTEM_DESIGN.md).
-- Run in the Supabase SQL editor when wiring P1+. Review before applying:
-- this supersedes the single-tenant demo `creative_outputs` in schema.sql
-- (it adds builder_id). If that table already exists, alter it instead.

-- Builders (tenants). One row per building company onboarded.
create table if not exists builders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  website text,
  region text,
  brand_voice text,            -- voice and tone guidelines
  serves text,                 -- who they build for / serve
  offer text,                  -- core offer + primary CTA
  proof_points jsonb,          -- ["19 years", "200+ homes", "fixed price"]
  visual_style text,           -- image / creative guidelines
  status text default 'active'
);

-- Frameworks: the agency's shared playbook.
-- builder_id null = global (every builder); set = builder-specific override.
create table if not exists frameworks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title text not null,
  category text not null,       -- 'copy' | 'hook' | 'image' | 'video'
  content text not null,
  builder_id uuid references builders(id) on delete cascade,
  tags text[]
  -- embedding vector(1536)     -- P5: relevance retrieval (pgvector)
);

-- Audience insights (voice-of-customer research) per builder.
create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  builder_id uuid not null references builders(id) on delete cascade,
  kind text,                    -- 'pain' | 'desire' | 'objection' | 'phrase'
  content text not null,
  source_url text,              -- grounding (real quote / page)
  source_type text,             -- 'reddit' | 'review' | 'youtube' | 'forum'
  status text default 'pending' -- 'pending' | 'approved' | 'rejected'
  -- embedding vector(1536)
);

-- Generated creative, linked to a builder.
create table if not exists creative_outputs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  builder_id uuid references builders(id) on delete cascade,
  campaign_angle text not null,
  campaign_goal text not null,
  hooks jsonb not null,
  body_copy jsonb not null,
  ctas jsonb not null,
  final_hook text,
  final_body text,
  final_cta text,
  image_prompt text,
  image_url_higgsfield text,
  image_url_openai text,
  copy_model text default 'claude',
  status text default 'draft',
  approved boolean default false
);

-- Performance results per output. source = 'manual' | 'meta_api'.
create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  builder_id uuid not null references builders(id) on delete cascade,
  output_id uuid references creative_outputs(id) on delete set null,
  source text default 'manual',
  meta_ad_id text,
  date_start date,
  date_end date,
  impressions bigint,
  clicks bigint,
  spend numeric,
  leads bigint,
  ctr numeric,
  cpl numeric,
  roas numeric,
  outcome text                  -- 'winner' | 'loser' | 'neutral'
);

-- Distilled learnings per builder (auto-generated + manual).
create table if not exists learnings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  builder_id uuid not null references builders(id) on delete cascade,
  insight text not null,        -- "cost-blowout + fixed-price proof -> 2.3x leads"
  evidence jsonb,               -- supporting output/result ids
  confidence text               -- 'low' | 'medium' | 'high'
);

create index if not exists frameworks_category_idx on frameworks (category);
create index if not exists frameworks_builder_idx on frameworks (builder_id);
create index if not exists insights_builder_idx on insights (builder_id);
create index if not exists outputs_builder_idx on creative_outputs (builder_id);
create index if not exists results_builder_idx on results (builder_id);
create index if not exists results_output_idx on results (output_id);
create index if not exists learnings_builder_idx on learnings (builder_id);
