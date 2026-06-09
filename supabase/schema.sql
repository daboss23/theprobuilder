-- Summit Build Co — AI Creative System
-- Run this in the Supabase SQL editor before using the app.

create table if not exists creative_outputs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
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

create index if not exists creative_outputs_created_at_idx
  on creative_outputs (created_at desc);

-- Row Level Security: enable and add policies appropriate to your auth model.
-- The app writes with the service-role key (bypasses RLS) and reads with the
-- anon key, so a read policy is required if you turn RLS on.
alter table creative_outputs enable row level security;

create policy "Allow anon read access"
  on creative_outputs for select
  using (true);
