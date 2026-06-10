-- TPB Creative Reactor — RAG knowledge layer
-- Requires the pgvector extension. Run in the Supabase SQL editor.
-- Voyage `voyage-3` returns 1024-dimensional embeddings.

create extension if not exists vector;

-- Every chunk of ingested Knowledge Vault content, embedded for retrieval.
create table if not exists knowledge_chunks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  builder_id uuid,                 -- null = global TPB knowledge
  system text not null,            -- which intelligence system: vault | research | transformation | creative | copy | pattern | learning
  category text,                   -- e.g. "Winning Ads", "Hooks", "Hook Frameworks"
  title text not null,
  content text not null,           -- the chunk text
  metadata jsonb default '{}'::jsonb,
  embedding vector(1024)
);

-- Approximate nearest-neighbour index for fast cosine search.
create index if not exists knowledge_chunks_embedding_idx
  on knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create index if not exists knowledge_chunks_system_idx on knowledge_chunks (system);

-- Cosine-similarity retrieval. Returns the closest chunks to a query embedding,
-- optionally scoped to a builder (plus global) and/or a single intelligence system.
create or replace function match_knowledge (
  query_embedding vector(1024),
  match_count int default 8,
  filter_system text default null,
  filter_builder uuid default null
)
returns table (
  id uuid,
  system text,
  category text,
  title text,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    kc.id,
    kc.system,
    kc.category,
    kc.title,
    kc.content,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) as similarity
  from knowledge_chunks kc
  where (filter_system is null or kc.system = filter_system)
    and (filter_builder is null or kc.builder_id = filter_builder or kc.builder_id is null)
  order by kc.embedding <=> query_embedding
  limit match_count;
$$;

-- Live counts of stored knowledge, grouped by system + category. Powers the
-- Vault library view and the dashboard "assets stored" telemetry.
create or replace function knowledge_stats ()
returns table (
  system text,
  category text,
  count bigint
)
language sql stable
as $$
  select kc.system, kc.category, count(*)::bigint as count
  from knowledge_chunks kc
  group by kc.system, kc.category
  order by count(*) desc;
$$;

-- Closed-loop learning: log how generated campaigns actually performed so winners
-- can be re-ingested as new patterns and feed future retrieval.
create table if not exists campaign_outcomes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  builder_id uuid,
  angle text not null,
  concept jsonb not null,          -- the generated concept that ran
  metric_name text,                -- e.g. "CTR", "ROAS", "book_rate"
  metric_value numeric,
  verdict text default 'pending',  -- pending | winner | loser
  notes text
);
