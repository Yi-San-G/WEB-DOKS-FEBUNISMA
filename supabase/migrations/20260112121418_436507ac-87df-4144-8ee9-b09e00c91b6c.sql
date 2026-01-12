-- Change the submissions bucket from public to private
UPDATE storage.buckets SET public = false WHERE id = 'submissions';

-- Add storage policy for authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add storage policy for users to view their own files
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add storage policy for admins to view all files
CREATE POLICY "Admins can view all files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Add storage policy for admins to delete files
CREATE POLICY "Admins can delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'submissions' 
  AND public.has_role(auth.uid(), 'admin')
);