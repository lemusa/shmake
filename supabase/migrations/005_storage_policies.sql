-- Create assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY storage_assets_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assets');

-- Allow authenticated users to update their files
CREATE POLICY storage_assets_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'assets');

-- Allow authenticated users to delete files
CREATE POLICY storage_assets_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'assets');

-- Allow public read access (bucket is public)
CREATE POLICY storage_assets_select ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'assets');
