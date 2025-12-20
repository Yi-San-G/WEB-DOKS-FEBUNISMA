-- Add deleted_at column for soft delete functionality (trash)
ALTER TABLE public.submissions
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add RLS policy for admins to view deleted submissions
CREATE POLICY "Admins can view deleted submissions"
ON public.submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) AND deleted_at IS NOT NULL);

-- Add RLS policy for admins to delete submissions
CREATE POLICY "Admins can delete submissions"
ON public.submissions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));