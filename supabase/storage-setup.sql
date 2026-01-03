-- Storage setup for company logos
-- Run this in Supabase SQL Editor after running schema.sql

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for company-logos bucket
CREATE POLICY "Allow public read access on company logos" ON storage.objects
FOR SELECT USING (bucket_id = 'company-logos');

CREATE POLICY "Allow authenticated users to upload company logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to update their own company logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'company-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to delete their own company logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'company-logos' 
  AND auth.role() = 'authenticated'
);