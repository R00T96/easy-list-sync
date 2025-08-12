-- Enable realtime for shopping_items table
ALTER TABLE public.shopping_items REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_items;