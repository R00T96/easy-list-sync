-- Add quantum key security columns to pin_preferences
ALTER TABLE pin_preferences
  ADD COLUMN IF NOT EXISTS quantum_key_hash BYTEA,
  ADD COLUMN IF NOT EXISTS quantum_key_salt BYTEA,
  ADD COLUMN IF NOT EXISTS protected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS protected_by_device_id TEXT,
  ADD COLUMN IF NOT EXISTS protection_version INTEGER NOT NULL DEFAULT 0;

-- Create partial unique index to prevent race conditions (only one protection per PIN)
CREATE UNIQUE INDEX IF NOT EXISTS pin_only_one_protected
  ON pin_preferences (pin)
  WHERE is_protected = TRUE;

-- Create audit table for tracking protection events
CREATE TABLE IF NOT EXISTS pin_protection_audit (
  id BIGSERIAL PRIMARY KEY,
  pin TEXT NOT NULL,
  event TEXT NOT NULL, -- 'CLAIM_ATTEMPT','CLAIM_SUCCESS','VERIFY_SUCCESS','VERIFY_FAIL','REMOVE','ROTATE','IMPORT'
  device_id TEXT,
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB
);

-- Create index for querying audit logs by PIN
CREATE INDEX IF NOT EXISTS pin_protection_audit_pin_idx ON pin_protection_audit (pin, created_at DESC);

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS pin_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  pin TEXT NOT NULL,
  ip INET NOT NULL,
  bucket_start TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  UNIQUE(pin, ip, bucket_start)
);

CREATE INDEX IF NOT EXISTS pin_rate_limits_idx ON pin_rate_limits (pin, ip, bucket_start);