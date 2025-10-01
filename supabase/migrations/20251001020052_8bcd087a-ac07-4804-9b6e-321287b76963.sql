-- Add list_type column to pin_preferences table
ALTER TABLE pin_preferences 
ADD COLUMN list_type TEXT NOT NULL DEFAULT 'shopping' CHECK (list_type IN ('shopping', 'todo'));

COMMENT ON COLUMN pin_preferences.list_type IS 'Type of list: shopping (with qty) or todo (simple checklist)';