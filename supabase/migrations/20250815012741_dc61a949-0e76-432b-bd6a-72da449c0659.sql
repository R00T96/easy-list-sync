-- Enable realtime for shopping_items table
ALTER TABLE public.shopping_items REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_items;

-- Add RLS policy for realtime (anon role needs SELECT access)
CREATE POLICY "Allow realtime select for anon"
ON public.shopping_items
FOR SELECT
TO anon
USING (list_id IS NOT NULL);

-- Ensure primary key exists (should already be there)
-- ALTER TABLE public.shopping_items ADD PRIMARY KEY (id); -- Only if missing