-- Add is_protected column to pin_preferences table
ALTER TABLE public.pin_preferences 
ADD COLUMN is_protected BOOLEAN NOT NULL DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.pin_preferences.is_protected IS 'Indicates if this list is protected by a quantum key';