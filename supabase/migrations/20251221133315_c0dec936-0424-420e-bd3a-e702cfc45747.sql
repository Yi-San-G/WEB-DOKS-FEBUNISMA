-- Add new file_url column for ZIP/RAR files
ALTER TABLE public.submissions ADD COLUMN file_url text;

-- Copy existing pdf_url to file_url (as fallback for existing data)
UPDATE public.submissions SET file_url = pdf_url WHERE file_url IS NULL;

-- Make file_url NOT NULL after populating
ALTER TABLE public.submissions ALTER COLUMN file_url SET NOT NULL;

-- Drop old columns
ALTER TABLE public.submissions DROP COLUMN pdf_url;
ALTER TABLE public.submissions DROP COLUMN word_url;