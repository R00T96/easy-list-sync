-- Create pin_preferences table for storing PIN-specific settings
CREATE TABLE public.pin_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pin TEXT NOT NULL UNIQUE,
  hide_footer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pin_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for PIN-based access
CREATE POLICY "PIN can read its own preferences" 
ON public.pin_preferences 
FOR SELECT 
USING ((get_header('x-list-id'::text) IS NOT NULL) AND (pin = get_header('x-list-id'::text)));

CREATE POLICY "PIN can insert its own preferences" 
ON public.pin_preferences 
FOR INSERT 
WITH CHECK ((get_header('x-list-id'::text) IS NOT NULL) AND (pin = get_header('x-list-id'::text)));

CREATE POLICY "PIN can update its own preferences" 
ON public.pin_preferences 
FOR UPDATE 
USING ((get_header('x-list-id'::text) IS NOT NULL) AND (pin = get_header('x-list-id'::text)))
WITH CHECK ((get_header('x-list-id'::text) IS NOT NULL) AND (pin = get_header('x-list-id'::text)));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pin_preferences_updated_at
BEFORE UPDATE ON public.pin_preferences
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();