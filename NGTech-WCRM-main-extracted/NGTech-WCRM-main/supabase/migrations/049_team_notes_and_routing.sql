-- ============================================================
-- 049_team_notes_and_routing.sql
-- 
-- 1. Adds internal notes capability (is_internal)
-- 2. Adds auto-assignment toggle to whatsapp_config
-- 3. Creates the auto_assign_conversation RPC
-- ============================================================

-- 1. Add is_internal to messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT false;

-- 2. Add auto_assign_enabled to whatsapp_config
ALTER TABLE whatsapp_config
  ADD COLUMN IF NOT EXISTS auto_assign_enabled BOOLEAN NOT NULL DEFAULT false;

-- 3. Create the Smart Auto-Assignment RPC
-- Finds the active agent with the fewest open conversations in the account
CREATE OR REPLACE FUNCTION auto_assign_conversation(p_conversation_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_selected_agent_id UUID;
BEGIN
  -- 1. Get the account_id for the conversation
  SELECT account_id INTO v_account_id
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_account_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Find the active agent with the fewest open conversations
  SELECT p.user_id INTO v_selected_agent_id
  FROM profiles p
  LEFT JOIN conversations c 
    ON c.assigned_agent_id = p.user_id 
    AND c.status = 'open' 
    AND c.account_id = v_account_id
  WHERE p.account_id = v_account_id
    AND p.is_suspended = false
  GROUP BY p.user_id
  ORDER BY COUNT(c.id) ASC, RANDOM()
  LIMIT 1;

  -- 3. If an agent is found, assign the conversation
  IF v_selected_agent_id IS NOT NULL THEN
    UPDATE conversations
    SET assigned_agent_id = v_selected_agent_id
    WHERE id = p_conversation_id;
  END IF;

  RETURN v_selected_agent_id;
END;
$$;

ALTER FUNCTION auto_assign_conversation(UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION auto_assign_conversation(UUID) TO authenticated, service_role;
