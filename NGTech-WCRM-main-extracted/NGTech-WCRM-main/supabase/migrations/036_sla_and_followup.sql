-- Add SLA configuration to whatsapp_config
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS sla_enabled BOOLEAN DEFAULT true;
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS sla_first_reply_min INTEGER DEFAULT 5;
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS sla_subsequent_reply_min INTEGER DEFAULT 15;

-- Add last message sender type tracking to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_sender_type TEXT CHECK (last_message_sender_type IN ('customer', 'agent', 'bot'));

-- Create/update the trigger function on messages to record last_message_sender_type
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

  -- Update conversations table with last_message_sender_type
  UPDATE conversations
  SET last_message_sender_type = NEW.sender_type
  WHERE id = NEW.conversation_id;

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

-- Backfill existing conversations with their last message sender type
UPDATE conversations c
SET last_message_sender_type = COALESCE(
  (SELECT sender_type FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1),
  'customer'
);
