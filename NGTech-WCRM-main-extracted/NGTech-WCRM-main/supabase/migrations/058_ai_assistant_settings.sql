-- 058_ai_assistant_settings.sql

-- 1. Create the new ai_assistant_settings table
CREATE TABLE IF NOT EXISTS ai_assistant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  provider VARCHAR(50) DEFAULT 'gemini',
  model VARCHAR(100) DEFAULT 'gemini-1.5-pro',
  system_prompt TEXT DEFAULT 'You are a helpful customer support assistant for this business.',
  knowledge_base TEXT DEFAULT '',
  personality TEXT,
  allowed_topics TEXT,
  restricted_topics TEXT,
  human_handoff_rules TEXT,
  respect_business_hours BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (account_id)
);

-- 2. Enable RLS and add policies
ALTER TABLE ai_assistant_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_assistant_settings_select ON ai_assistant_settings;
CREATE POLICY ai_assistant_settings_select ON ai_assistant_settings FOR SELECT USING (is_account_member(account_id));

DROP POLICY IF EXISTS ai_assistant_settings_insert ON ai_assistant_settings;
CREATE POLICY ai_assistant_settings_insert ON ai_assistant_settings FOR INSERT WITH CHECK (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS ai_assistant_settings_update ON ai_assistant_settings;
CREATE POLICY ai_assistant_settings_update ON ai_assistant_settings FOR UPDATE USING (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS ai_assistant_settings_delete ON ai_assistant_settings;
CREATE POLICY ai_assistant_settings_delete ON ai_assistant_settings FOR DELETE USING (is_account_member(account_id, 'admin'));

-- 3. Add updated_at trigger
DROP TRIGGER IF EXISTS set_ai_settings_updated_at ON ai_assistant_settings;
CREATE TRIGGER set_ai_settings_updated_at 
  BEFORE UPDATE ON ai_assistant_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Migrate existing data from whatsapp_config
INSERT INTO ai_assistant_settings (
  account_id,
  enabled,
  system_prompt,
  knowledge_base,
  provider,
  model,
  respect_business_hours
)
SELECT 
  account_id,
  COALESCE(ai_auto_reply_enabled, false),
  COALESCE(ai_auto_reply_prompt, 'You are a helpful customer support assistant for this business.'),
  COALESCE(ai_knowledge_base, ''),
  'gemini',
  'gemini-1.5-pro',
  true
FROM whatsapp_config
ON CONFLICT (account_id) DO NOTHING;
