-- ============================================================
-- 035_agent_scorecard_and_intelligence.sql
-- ============================================================

-- 1. Create conversation_metrics table
CREATE TABLE IF NOT EXISTS conversation_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_response_time_ms BIGINT,
  resolution_time_ms BIGINT,
  csat_score INTEGER CHECK (csat_score BETWEEN 1 AND 5),
  csat_submitted_at TIMESTAMPTZ,
  message_count_agent INTEGER DEFAULT 0,
  message_count_bot INTEGER DEFAULT 0,
  message_count_customer INTEGER DEFAULT 0,
  resolved_by TEXT CHECK (resolved_by IN ('agent', 'bot')),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_metrics_account ON conversation_metrics(account_id);
CREATE INDEX IF NOT EXISTS idx_conversation_metrics_agent ON conversation_metrics(assigned_agent_id);

-- Enable RLS for conversation_metrics
ALTER TABLE conversation_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conversation_metrics_select ON conversation_metrics;
DROP POLICY IF EXISTS conversation_metrics_all ON conversation_metrics;

CREATE POLICY conversation_metrics_select ON conversation_metrics
  FOR SELECT USING (is_account_member(account_id));
CREATE POLICY conversation_metrics_all ON conversation_metrics
  FOR ALL USING (is_account_member(account_id, 'agent')) WITH CHECK (is_account_member(account_id, 'agent'));


-- 2. Create conversation_topics table
CREATE TABLE IF NOT EXISTS conversation_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  confidence REAL DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_topics_account ON conversation_topics(account_id);
CREATE INDEX IF NOT EXISTS idx_conversation_topics_conv ON conversation_topics(conversation_id);

-- Enable RLS for conversation_topics
ALTER TABLE conversation_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conversation_topics_select ON conversation_topics;
DROP POLICY IF EXISTS conversation_topics_all ON conversation_topics;

CREATE POLICY conversation_topics_select ON conversation_topics
  FOR SELECT USING (is_account_member(account_id));
CREATE POLICY conversation_topics_all ON conversation_topics
  FOR ALL USING (is_account_member(account_id, 'agent')) WITH CHECK (is_account_member(account_id, 'agent'));


-- 3. Create ai_insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('faq', 'churn_risk', 'topic_trend')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_account ON ai_insights(account_id);

-- Enable RLS for ai_insights
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_insights_select ON ai_insights;
DROP POLICY IF EXISTS ai_insights_all ON ai_insights;

CREATE POLICY ai_insights_select ON ai_insights
  FOR SELECT USING (is_account_member(account_id));
CREATE POLICY ai_insights_all ON ai_insights
  FOR ALL USING (is_account_member(account_id, 'agent')) WITH CHECK (is_account_member(account_id, 'agent'));


-- 4. Add topic and auto-tag columns to conversations
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS ai_topic TEXT,
  ADD COLUMN IF NOT EXISTS ai_auto_tags TEXT[];


-- 5. Trigger to update metrics on new messages
CREATE OR REPLACE FUNCTION update_conversation_metrics_on_message()
RETURNS TRIGGER AS $$
DECLARE
  v_account_id UUID;
  v_assigned_agent_id UUID;
  v_last_customer_msg_at TIMESTAMPTZ;
  v_first_resp_time_ms BIGINT;
BEGIN
  -- Get account_id and current assigned agent from conversations
  SELECT account_id, assigned_agent_id INTO v_account_id, v_assigned_agent_id
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Ensure we have a conversation_metrics row
  INSERT INTO conversation_metrics (account_id, conversation_id, assigned_agent_id)
  VALUES (v_account_id, NEW.conversation_id, v_assigned_agent_id)
  ON CONFLICT (conversation_id) DO UPDATE
  SET assigned_agent_id = COALESCE(EXCLUDED.assigned_agent_id, conversation_metrics.assigned_agent_id);

  -- Increment message counts based on sender_type
  IF NEW.sender_type = 'customer' THEN
    UPDATE conversation_metrics
    SET message_count_customer = message_count_customer + 1
    WHERE conversation_id = NEW.conversation_id;

    -- If this customer message is a number between 1 and 5, check if we should record CSAT
    IF NEW.content_type = 'text' AND NEW.content_text ~ '^[1-5]$' THEN
      UPDATE conversation_metrics
      SET 
        csat_score = NEW.content_text::integer,
        csat_submitted_at = NOW()
      WHERE conversation_id = NEW.conversation_id
        AND csat_score IS NULL
        AND closed_at >= NOW() - INTERVAL '24 hours';
    END IF;

  ELSIF NEW.sender_type = 'agent' THEN
    UPDATE conversation_metrics
    SET message_count_agent = message_count_agent + 1
    WHERE conversation_id = NEW.conversation_id;

    -- Calculate first response time if not already set
    SELECT first_response_time_ms INTO v_first_resp_time_ms
    FROM conversation_metrics
    WHERE conversation_id = NEW.conversation_id;

    IF v_first_resp_time_ms IS NULL THEN
      -- Find the first customer message in this conversation
      SELECT MIN(created_at) INTO v_last_customer_msg_at
      FROM messages
      WHERE conversation_id = NEW.conversation_id AND sender_type = 'customer';

      IF v_last_customer_msg_at IS NOT NULL THEN
        UPDATE conversation_metrics
        SET first_response_time_ms = EXTRACT(EPOCH FROM (NEW.created_at - v_last_customer_msg_at)) * 1000
        WHERE conversation_id = NEW.conversation_id;
      END IF;
    END IF;

  ELSIF NEW.sender_type = 'bot' THEN
    UPDATE conversation_metrics
    SET message_count_bot = message_count_bot + 1
    WHERE conversation_id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_metrics ON messages;
CREATE TRIGGER trigger_update_conversation_metrics
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_metrics_on_message();


-- 6. Trigger to update metrics on conversation status/agent updates
CREATE OR REPLACE FUNCTION update_conversation_metrics_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_agent_msg_count INTEGER;
BEGIN
  -- Ensure the metrics row exists
  INSERT INTO conversation_metrics (account_id, conversation_id, assigned_agent_id)
  VALUES (NEW.account_id, NEW.id, NEW.assigned_agent_id)
  ON CONFLICT (conversation_id) DO UPDATE
  SET assigned_agent_id = COALESCE(EXCLUDED.assigned_agent_id, conversation_metrics.assigned_agent_id);

  -- If conversation is closed
  IF NEW.status = 'closed' AND OLD.status <> 'closed' THEN
    -- Check if agent ever sent a message in this conversation
    SELECT COUNT(*) INTO v_agent_msg_count
    FROM messages
    WHERE conversation_id = NEW.id AND sender_type = 'agent';

    UPDATE conversation_metrics
    SET 
      closed_at = NOW(),
      resolved_by = CASE WHEN v_agent_msg_count > 0 THEN 'agent' ELSE 'bot' END,
      resolution_time_ms = EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) * 1000
    WHERE conversation_id = NEW.id;
  END IF;

  -- Sync assigned agent
  IF NEW.assigned_agent_id IS DISTINCT FROM OLD.assigned_agent_id THEN
    UPDATE conversation_metrics
    SET assigned_agent_id = NEW.assigned_agent_id
    WHERE conversation_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_metrics_status ON conversations;
CREATE TRIGGER trigger_update_conversation_metrics_status
AFTER UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_conversation_metrics_on_status_change();
