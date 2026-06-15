-- Face / character roster for in-house UGC (Seedance 2.0 reference-to-video).
-- Each row is a saved reference asset (image or short video) whose public URL is
-- fed to the model as an identity reference so a character stays consistent
-- across generated clips. Assets live in the public Storage bucket 'faces'.

CREATE TABLE IF NOT EXISTS faces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  builder_id UUID REFERENCES builders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'image',  -- 'image' | 'video'
  url TEXT NOT NULL,                    -- public URL the model can fetch
  storage_path TEXT                     -- object path in the 'faces' bucket
);

CREATE INDEX IF NOT EXISTS faces_builder_idx ON faces (builder_id);
CREATE INDEX IF NOT EXISTS faces_created_idx ON faces (created_at DESC);

-- Storage: create a public bucket named 'faces' (the app also tries to create it
-- on first upload). Public so the video model can read the reference URLs.
-- In the Supabase dashboard: Storage → New bucket → name "faces", Public ON.
