-- Set replica identity for realtime (may already be set)
ALTER TABLE public.shopping_items REPLICA IDENTITY FULL;

-- Add RLS policy for realtime (anon role needs SELECT access)
CREATE POLICY "Allow realtime select for anon"
ON public.shopping_items
FOR SELECT
TO anon
USING (list_id IS NOT NULL);