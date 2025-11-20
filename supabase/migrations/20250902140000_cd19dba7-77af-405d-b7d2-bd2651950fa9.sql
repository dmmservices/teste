-- Check if the empresas table has a logo column and add it if it doesn't exist
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS logo_url TEXT;