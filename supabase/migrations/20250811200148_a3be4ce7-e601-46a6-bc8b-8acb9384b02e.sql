-- Secure multi-tenant access via PIN (list_id)
-- 1) Replace permissive policies with header-scoped policies
-- 2) Ensure updated_at maintained on updates
-- 3) Keep anonymous access but require matching x-list-id header

-- Enable RLS (already enabled, but ensure)
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'shopping_items' 
      AND policyname = 'Public can read shopping items'
  ) THEN
    DROP POLICY "Public can read shopping items" ON public.shopping_items;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'shopping_items' 
      AND policyname = 'Public can insert shopping items'
  ) THEN
    DROP POLICY "Public can insert shopping items" ON public.shopping_items;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'shopping_items' 
      AND policyname = 'Public can update shopping items'
  ) THEN
    DROP POLICY "Public can update shopping items" ON public.shopping_items;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'shopping_items' 
      AND policyname = 'Public can delete shopping items'
  ) THEN
    DROP POLICY "Public can delete shopping items" ON public.shopping_items;
  END IF;
END $$;

-- Helper to read request header safely (PostgREST exposes request.headers)
-- We will rely on the JSON GUC `request.headers` which contains lower-cased header names
CREATE OR REPLACE FUNCTION public.get_header(name text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE( (
    current_setting('request.headers', true)::jsonb ->> lower(name)
  ), NULL);
$$;

-- Create secure policies scoped by x-list-id header
CREATE POLICY "PIN can read its own items"
ON public.shopping_items
FOR SELECT
USING (
  public.get_header('x-list-id') IS NOT NULL
  AND list_id = public.get_header('x-list-id')
);

CREATE POLICY "PIN can insert its own items"
ON public.shopping_items
FOR INSERT
WITH CHECK (
  public.get_header('x-list-id') IS NOT NULL
  AND list_id = public.get_header('x-list-id')
);

CREATE POLICY "PIN can update its own items"
ON public.shopping_items
FOR UPDATE
USING (
  public.get_header('x-list-id') IS NOT NULL
  AND list_id = public.get_header('x-list-id')
)
WITH CHECK (
  public.get_header('x-list-id') IS NOT NULL
  AND list_id = public.get_header('x-list-id')
);

CREATE POLICY "PIN can delete its own items"
ON public.shopping_items
FOR DELETE
USING (
  public.get_header('x-list-id') IS NOT NULL
  AND list_id = public.get_header('x-list-id')
);

-- Maintain updated_at on update
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_shopping_items'
  ) THEN
    CREATE TRIGGER trg_set_updated_at_shopping_items
    BEFORE UPDATE ON public.shopping_items
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Optional but recommended for realtime completeness
ALTER TABLE public.shopping_items REPLICA IDENTITY FULL;