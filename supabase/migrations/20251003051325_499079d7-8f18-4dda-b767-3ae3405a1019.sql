-- Enable RLS on the new audit and rate limiting tables
ALTER TABLE pin_protection_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for pin_protection_audit
-- Only allow reading audit logs for the current PIN (via x-list-id header)
CREATE POLICY "PIN can read its own audit logs"
  ON pin_protection_audit
  FOR SELECT
  USING (
    get_header('x-list-id'::text) IS NOT NULL 
    AND pin = get_header('x-list-id'::text)
  );

-- Only edge functions (service role) can insert audit logs
-- No policy needed - will be inserted via service role

-- RLS policies for pin_rate_limits
-- No public access needed - only used internally by edge functions via service role
-- No policies needed