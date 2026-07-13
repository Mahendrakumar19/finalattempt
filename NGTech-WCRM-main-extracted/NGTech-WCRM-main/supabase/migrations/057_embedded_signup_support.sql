-- ============================================================
-- 057_embedded_signup_support.sql
-- Adds support for multi-step Embedded Signup and connection archiving.
-- ============================================================

-- 1. Add fields to whatsapp_config to safely preserve old connections 
--    and store expanded connection metadata.
ALTER TABLE whatsapp_config 
  ADD COLUMN IF NOT EXISTS archived_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS business_id TEXT,
  ADD COLUMN IF NOT EXISTS display_phone_number TEXT,
  ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'connected',
  ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disconnected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- 2. Create the temporary session table for Embedded Signup onboarding.
--    This stores the Meta token and phone numbers while the user selects
--    which number to connect, ensuring the token never reaches the frontend.
CREATE TABLE IF NOT EXISTS whatsapp_signup_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  access_token_encrypted TEXT NOT NULL,
  waba_id TEXT NOT NULL,
  business_id TEXT,
  phone_numbers JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_phone_number_id TEXT,
  display_phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

ALTER TABLE whatsapp_signup_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own signup sessions" ON whatsapp_signup_sessions;
CREATE POLICY "Users can manage own signup sessions" ON whatsapp_signup_sessions FOR ALL USING (
  is_account_member(account_id, 'admin')
);

-- Index for auto-cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_whatsapp_signup_sessions_expires_at 
  ON whatsapp_signup_sessions(expires_at);

-- Prevent multiple active signup sessions for a single account
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_signup 
  ON whatsapp_signup_sessions (account_id) 
  WHERE status IN ('pending', 'verified');

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_signup_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM whatsapp_signup_sessions
  WHERE expires_at < NOW();
END;
$$;
