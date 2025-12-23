-- Add columns for tracking tanggungan pustaka status
ALTER TABLE public.submissions 
ADD COLUMN softfile_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN cetak_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN bebas_pustaka_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- When a submission is accepted, automatically set softfile_at to now() 
-- This is handled in application code when status changes to 'accepted'