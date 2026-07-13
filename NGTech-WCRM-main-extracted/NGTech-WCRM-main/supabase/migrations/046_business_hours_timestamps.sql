-- 046_business_hours_timestamps.sql

ALTER TABLE conversation_metrics 
ADD COLUMN IF NOT EXISTS first_customer_msg_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS first_agent_reply_at TIMESTAMPTZ;

-- We need to update the trigger to populate these fields.
CREATE OR REPLACE FUNCTION update_conversation_metrics_on_message()
RETURNS TRIGGER AS $$
DECLARE
  v_account_id UUID;
  v_assigned_agent_id UUID;
  v_first_response_time_ms BIGINT;
  v_last_customer_msg_at TIMESTAMPTZ;
  v_existing_reply_at TIMESTAMPTZ;
BEGIN
  -- Get assigned agent and account_id
  SELECT account_id, assigned_agent_id INTO v_account_id, v_assigned_agent_id
  FROM conversations WHERE id = NEW.conversation_id;

  -- Ensure row exists
  INSERT INTO conversation_metrics (account_id, conversation_id, assigned_agent_id)
  VALUES (v_account_id, NEW.conversation_id, v_assigned_agent_id)
  ON CONFLICT (conversation_id) DO NOTHING;

  -- Update message counts and timestamps
  IF NEW.sender_type = 'customer' THEN
    UPDATE conversation_metrics
    SET message_count_customer = message_count_customer + 1,
        first_customer_msg_at = COALESCE(first_customer_msg_at, NEW.created_at)
    WHERE conversation_id = NEW.conversation_id;
  ELSIF NEW.sender_type = 'bot' THEN
    UPDATE conversation_metrics
    SET message_count_bot = message_count_bot + 1
    WHERE conversation_id = NEW.conversation_id;
  ELSIF NEW.sender_type = 'agent' THEN
    -- Get last customer message time to calculate response time
    SELECT created_at INTO v_last_customer_msg_at
    FROM messages
    WHERE conversation_id = NEW.conversation_id AND sender_type = 'customer'
    ORDER BY created_at DESC LIMIT 1;

    -- Check if we already have a first reply
    SELECT first_agent_reply_at INTO v_existing_reply_at 
    FROM conversation_metrics 
    WHERE conversation_id = NEW.conversation_id;

    -- Update counts and calculate response time if not already set
    IF v_last_customer_msg_at IS NOT NULL AND v_existing_reply_at IS NULL THEN
      v_first_response_time_ms := EXTRACT(EPOCH FROM (NEW.created_at - v_last_customer_msg_at)) * 1000;
      UPDATE conversation_metrics
      SET message_count_agent = message_count_agent + 1,
          first_response_time_ms = COALESCE(first_response_time_ms, v_first_response_time_ms),
          first_agent_reply_at = COALESCE(first_agent_reply_at, NEW.created_at)
      WHERE conversation_id = NEW.conversation_id;
    ELSE
      UPDATE conversation_metrics
      SET message_count_agent = message_count_agent + 1
      WHERE conversation_id = NEW.conversation_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
