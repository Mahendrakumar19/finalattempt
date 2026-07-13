-- 064_enterprise_routing_engine.sql

-- 1. Update conversations table with new routing and AI tracking fields
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS routing_status TEXT DEFAULT 'unassigned',
  ADD COLUMN IF NOT EXISTS ai_processing_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS routing_method TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_classification_confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_detected_intent TEXT,
  ADD COLUMN IF NOT EXISTS ai_detected_sentiment TEXT,
  ADD COLUMN IF NOT EXISTS routing_time_ms INT;

-- Status indexes for quick filtering
CREATE INDEX IF NOT EXISTS idx_conversations_routing_status ON conversations(routing_status);
CREATE INDEX IF NOT EXISTS idx_conversations_ai_proc_status ON conversations(ai_processing_status);

-- 2. Update AI Assistant Settings with confidence threshold
ALTER TABLE ai_assistant_settings
  ADD COLUMN IF NOT EXISTS routing_confidence_threshold NUMERIC DEFAULT 90;

-- 3. Create the Audit Log Table for Routing
CREATE TABLE IF NOT EXISTS conversation_routing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be null for AI/System
  event_type TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  reason TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routing_logs_conv ON conversation_routing_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_routing_logs_acc ON conversation_routing_logs(account_id);

ALTER TABLE conversation_routing_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS routing_logs_select ON conversation_routing_logs;
CREATE POLICY routing_logs_select ON conversation_routing_logs FOR SELECT USING (is_account_member(account_id));

DROP POLICY IF EXISTS routing_logs_insert ON conversation_routing_logs;
CREATE POLICY routing_logs_insert ON conversation_routing_logs FOR INSERT WITH CHECK (is_account_member(account_id));

-- 4. Update the Routing Engine RPC (auto_assign_conversation)
-- This enforces that conversations must be in the 'department_queue' (or already assigned) to be routed.
-- If no department is set, it cannot be auto-assigned to an agent.

CREATE OR REPLACE FUNCTION auto_assign_conversation(p_conversation_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_department_id UUID;
  v_routing_status TEXT;
  v_queue_strategy TEXT;
  v_selected_agent_id UUID;
BEGIN
  -- 1. Get conversation details
  SELECT account_id, department_id, routing_status 
  INTO v_account_id, v_department_id, v_routing_status
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_account_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- ENFORCEMENT: Never assign if it is unassigned/needs manual review and has no department
  IF v_department_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Determine queue strategy
  SELECT queue_strategy INTO v_queue_strategy
  FROM departments
  WHERE id = v_department_id;
  
  v_queue_strategy := COALESCE(v_queue_strategy, 'least_busy');

  IF v_queue_strategy = 'manual' THEN
    -- Leave it unassigned for manual picking in the department queue
    RETURN NULL;
  END IF;

  -- 3. Select agent based on strategy
  IF v_queue_strategy = 'round_robin' THEN
    SELECT p.user_id INTO v_selected_agent_id
    FROM profiles p
    LEFT JOIN (
      SELECT assigned_agent_id, MAX(created_at) as last_assigned_at
      FROM conversations
      WHERE account_id = v_account_id
      GROUP BY assigned_agent_id
    ) c ON c.assigned_agent_id = p.user_id
    WHERE p.account_id = v_account_id
      AND p.is_suspended = false
      AND EXISTS (
        SELECT 1 FROM department_members dm 
        WHERE dm.department_id = v_department_id 
        AND dm.user_id = p.user_id
      )
    ORDER BY c.last_assigned_at ASC NULLS FIRST, RANDOM()
    LIMIT 1;
    
  ELSIF v_queue_strategy = 'least_busy' THEN
    SELECT p.user_id INTO v_selected_agent_id
    FROM profiles p
    LEFT JOIN conversations c 
      ON c.assigned_agent_id = p.user_id 
      AND c.status = 'open' 
      AND c.account_id = v_account_id
    WHERE p.account_id = v_account_id
      AND p.is_suspended = false
      AND EXISTS (
        SELECT 1 FROM department_members dm 
        WHERE dm.department_id = v_department_id 
        AND dm.user_id = p.user_id
      )
    GROUP BY p.user_id
    ORDER BY COUNT(c.id) ASC, RANDOM()
    LIMIT 1;
    
  ELSIF v_queue_strategy = 'manager_first' THEN
    SELECT p.user_id INTO v_selected_agent_id
    FROM profiles p
    LEFT JOIN conversations c 
      ON c.assigned_agent_id = p.user_id 
      AND c.status = 'open' 
      AND c.account_id = v_account_id
    WHERE p.account_id = v_account_id
      AND p.is_suspended = false
      AND EXISTS (
        SELECT 1 FROM department_members dm 
        WHERE dm.department_id = v_department_id 
        AND dm.user_id = p.user_id
        AND dm.role = 'manager'
      )
    GROUP BY p.user_id
    ORDER BY COUNT(c.id) ASC, RANDOM()
    LIMIT 1;
    
    IF v_selected_agent_id IS NULL THEN
      SELECT p.user_id INTO v_selected_agent_id
      FROM profiles p
      LEFT JOIN conversations c 
        ON c.assigned_agent_id = p.user_id 
        AND c.status = 'open' 
        AND c.account_id = v_account_id
      WHERE p.account_id = v_account_id
        AND p.is_suspended = false
        AND EXISTS (
          SELECT 1 FROM department_members dm 
          WHERE dm.department_id = v_department_id 
          AND dm.user_id = p.user_id
        )
      GROUP BY p.user_id
      ORDER BY COUNT(c.id) ASC, RANDOM()
      LIMIT 1;
    END IF;
    
  ELSIF v_queue_strategy = 'vip' THEN
    SELECT p.user_id INTO v_selected_agent_id
    FROM profiles p
    LEFT JOIN conversations c 
      ON c.assigned_agent_id = p.user_id 
      AND c.status = 'open' 
      AND c.account_id = v_account_id
    WHERE p.account_id = v_account_id
      AND p.is_suspended = false
      AND EXISTS (
        SELECT 1 FROM department_members dm 
        WHERE dm.department_id = v_department_id 
        AND dm.user_id = p.user_id
        AND dm.role IN ('manager', 'supervisor')
      )
    GROUP BY p.user_id
    ORDER BY COUNT(c.id) ASC, RANDOM()
    LIMIT 1;
    
    IF v_selected_agent_id IS NULL THEN
      SELECT p.user_id INTO v_selected_agent_id
      FROM profiles p
      LEFT JOIN conversations c 
        ON c.assigned_agent_id = p.user_id 
        AND c.status = 'open' 
        AND c.account_id = v_account_id
      WHERE p.account_id = v_account_id
        AND p.is_suspended = false
        AND EXISTS (
          SELECT 1 FROM department_members dm 
          WHERE dm.department_id = v_department_id 
          AND dm.user_id = p.user_id
        )
      GROUP BY p.user_id
      ORDER BY COUNT(c.id) ASC, RANDOM()
      LIMIT 1;
    END IF;
  ELSE
    SELECT p.user_id INTO v_selected_agent_id
    FROM profiles p
    LEFT JOIN conversations c 
      ON c.assigned_agent_id = p.user_id 
      AND c.status = 'open' 
      AND c.account_id = v_account_id
    WHERE p.account_id = v_account_id
      AND p.is_suspended = false
      AND EXISTS (
        SELECT 1 FROM department_members dm 
        WHERE dm.department_id = v_department_id 
        AND dm.user_id = p.user_id
      )
    GROUP BY p.user_id
    ORDER BY COUNT(c.id) ASC, RANDOM()
    LIMIT 1;
  END IF;

  -- 4. Assign and log
  IF v_selected_agent_id IS NOT NULL THEN
    UPDATE conversations
    SET assigned_agent_id = v_selected_agent_id,
        routing_status = 'assigned',
        routing_method = v_queue_strategy
    WHERE id = p_conversation_id;
    
    -- Insert audit log
    INSERT INTO conversation_routing_logs (
      conversation_id, account_id, event_type, previous_value, new_value, reason
    ) VALUES (
      p_conversation_id, v_account_id, 'agent_assigned', NULL, v_selected_agent_id::text, 'auto_assign_conversation'
    );
  END IF;

  RETURN v_selected_agent_id;
END;
$$;
