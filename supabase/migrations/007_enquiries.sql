-- Enquiries table for capturing web contact form submissions
CREATE TABLE IF NOT EXISTS enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'New',
  notes text,
  job_id bigint REFERENCES jobs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Grant table privileges (required for RLS policies to work via Supabase API)
GRANT INSERT ON enquiries TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE ON enquiries TO authenticated;

-- RLS
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Anonymous users can insert (public contact form)
CREATE POLICY "anon_insert_enquiries" ON enquiries
  FOR INSERT TO anon WITH CHECK (true);

-- Authenticated users can insert (form works when logged in too)
CREATE POLICY "auth_insert_enquiries" ON enquiries
  FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated users can read all
CREATE POLICY "auth_select_enquiries" ON enquiries
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can update
CREATE POLICY "auth_update_enquiries" ON enquiries
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Authenticated users can delete
CREATE POLICY "auth_delete_enquiries" ON enquiries
  FOR DELETE TO authenticated USING (true);

-- Index for listing by date
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries (status);
