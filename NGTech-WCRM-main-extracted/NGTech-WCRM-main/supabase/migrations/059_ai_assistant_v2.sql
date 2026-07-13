-- 059_ai_assistant_v2.sql

-- 1. Extend ai_assistant_settings with JSONB configurations
ALTER TABLE ai_assistant_settings
  ADD COLUMN IF NOT EXISTS advanced_settings JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS knowledge_base_structured JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_rules JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS handoff_rules JSONB DEFAULT '{}'::jsonb;

-- 2. Create ai_analytics_events table
CREATE TABLE IF NOT EXISTS ai_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  provider VARCHAR(50),
  model VARCHAR(100),
  response_time_ms INTEGER,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  estimated_cost NUMERIC(10, 6) DEFAULT 0.0,
  is_handoff BOOLEAN DEFAULT false,
  is_error BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_analytics_events_account_date 
  ON ai_analytics_events(account_id, created_at);

-- RLS for analytics
ALTER TABLE ai_analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_analytics_events_select ON ai_analytics_events;
CREATE POLICY ai_analytics_events_select ON ai_analytics_events FOR SELECT USING (is_account_member(account_id));

DROP POLICY IF EXISTS ai_analytics_events_insert ON ai_analytics_events;
CREATE POLICY ai_analytics_events_insert ON ai_analytics_events FOR INSERT WITH CHECK (is_account_member(account_id, 'admin'));

-- 3. Create ai_knowledge_documents table
CREATE TABLE IF NOT EXISTS ai_knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_documents_account 
  ON ai_knowledge_documents(account_id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_ai_knowledge_documents_updated_at ON ai_knowledge_documents;
CREATE TRIGGER set_ai_knowledge_documents_updated_at 
  BEFORE UPDATE ON ai_knowledge_documents 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS for documents
ALTER TABLE ai_knowledge_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_knowledge_documents_select ON ai_knowledge_documents;
CREATE POLICY ai_knowledge_documents_select ON ai_knowledge_documents FOR SELECT USING (is_account_member(account_id));

DROP POLICY IF EXISTS ai_knowledge_documents_insert ON ai_knowledge_documents;
CREATE POLICY ai_knowledge_documents_insert ON ai_knowledge_documents FOR INSERT WITH CHECK (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS ai_knowledge_documents_delete ON ai_knowledge_documents;
CREATE POLICY ai_knowledge_documents_delete ON ai_knowledge_documents FOR DELETE USING (is_account_member(account_id, 'admin'));

-- Note: No update policy needed for documents right now, mostly insert/delete.
