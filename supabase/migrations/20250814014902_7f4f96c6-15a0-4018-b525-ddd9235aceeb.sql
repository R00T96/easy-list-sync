-- Add client_id column to track device origin
ALTER TABLE public.shopping_items 
ADD COLUMN client_id TEXT;