-- Remove the overly permissive storage policy that allows any authenticated user to view all files
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;

-- Also remove the overly permissive upload policy if it exists
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;