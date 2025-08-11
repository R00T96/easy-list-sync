-- Fix linter: set stable function search_path explicitly
ALTER FUNCTION public.get_header(name text) SET search_path = public, pg_temp;
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;