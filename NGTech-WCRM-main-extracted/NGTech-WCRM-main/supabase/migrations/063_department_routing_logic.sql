-- 063_department_routing_logic.sql

-- Update the Smart Auto-Assignment RPC to respect department routing strategies:
-- 1. round_robin: Assigns to the agent who has been assigned a conversation least recently.
-- 2. least_busy: Assigns to the agent with the fewest open conversations.
-- 3. manager_first: Assigns to a manager in the department, falling back to least_busy agent.
-- 4. vip: Assigns only to a supervisor or manager in the department (least_busy among them), falling back to least_busy agent.
-- 5. manual: Does not auto-assign (leaves assigned_agent_id NULL).

CREATE OR REPLACE FUNCTION auto_assign_conversation(p_conversation_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_department_id UUID;
  v_queue_strategy TEXT;
  v_selected_agent_id UUID;
BEGIN
  -- 1. Get the account_id and department_id for the conversation
  SELECT account_id, department_id INTO v_account_id, v_department_id
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_account_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Determine queue strategy
  IF v_department_id IS NOT NULL THEN
    SELECT queue_strategy INTO v_queue_strategy
    FROM departments
    WHERE id = v_department_id;
  END IF;
  
  -- Default to 'least_busy' if no department or strategy is set
  v_queue_strategy := COALESCE(v_queue_strategy, 'least_busy');

  IF v_queue_strategy = 'manual' THEN
    -- Leave it unassigned for manual picking
    RETURN NULL;
  END IF;

  -- 3. Select agent based on strategy
  IF v_queue_strategy = 'round_robin' THEN
    -- Find agent whose last assigned conversation is the oldest (or who has never been assigned)
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
      AND (
        v_department_id IS NULL OR 
        EXISTS (
          SELECT 1 FROM department_members dm 
          WHERE dm.department_id = v_department_id 
          AND dm.user_id = p.user_id
        )
      )
    ORDER BY c.last_assigned_at ASC NULLS FIRST, RANDOM()
    LIMIT 1;
    
  ELSIF v_queue_strategy = 'least_busy' THEN
    -- Default: fewest open conversations
    SELECT p.user_id INTO v_selected_agent_id
    FROM profiles p
    LEFT JOIN conversations c 
      ON c.assigned_agent_id = p.user_id 
      AND c.status = 'open' 
      AND c.account_id = v_account_id
    WHERE p.account_id = v_account_id
      AND p.is_suspended = false
      AND (
        v_department_id IS NULL OR 
        EXISTS (
          SELECT 1 FROM department_members dm 
          WHERE dm.department_id = v_department_id 
          AND dm.user_id = p.user_id
        )
      )
    GROUP BY p.user_id
    ORDER BY COUNT(c.id) ASC, RANDOM()
    LIMIT 1;
    
  ELSIF v_queue_strategy = 'manager_first' THEN
    -- Try to assign to a manager first, then least busy
    SELECT p.user_id INTO v_selected_agent_id
    FROM profiles p
    LEFT JOIN conversations c 
      ON c.assigned_agent_id = p.user_id 
      AND c.status = 'open' 
      AND c.account_id = v_account_id
    WHERE p.account_id = v_account_id
      AND p.is_suspended = false
      AND (
        v_department_id IS NULL OR 
        EXISTS (
          SELECT 1 FROM department_members dm 
          WHERE dm.department_id = v_department_id 
          AND dm.user_id = p.user_id
          AND dm.role = 'manager'
        )
      )
    GROUP BY p.user_id
    ORDER BY COUNT(c.id) ASC, RANDOM()
    LIMIT 1;
    
    -- If no manager found, fallback to least_busy
    IF v_selected_agent_id IS NULL THEN
      SELECT p.user_id INTO v_selected_agent_id
      FROM profiles p
      LEFT JOIN conversations c 
        ON c.assigned_agent_id = p.user_id 
        AND c.status = 'open' 
        AND c.account_id = v_account_id
      WHERE p.account_id = v_account_id
        AND p.is_suspended = false
        AND (
          v_department_id IS NULL OR 
          EXISTS (
            SELECT 1 FROM department_members dm 
            WHERE dm.department_id = v_department_id 
            AND dm.user_id = p.user_id
          )
        )
      GROUP BY p.user_id
      ORDER BY COUNT(c.id) ASC, RANDOM()
      LIMIT 1;
    END IF;
    
  ELSIF v_queue_strategy = 'vip' THEN
    -- Try to assign to a supervisor or manager first (least busy)
    SELECT p.user_id INTO v_selected_agent_id
    FROM profiles p
    LEFT JOIN conversations c 
      ON c.assigned_agent_id = p.user_id 
      AND c.status = 'open' 
      AND c.account_id = v_account_id
    WHERE p.account_id = v_account_id
      AND p.is_suspended = false
      AND (
        v_department_id IS NULL OR 
        EXISTS (
          SELECT 1 FROM department_members dm 
          WHERE dm.department_id = v_department_id 
          AND dm.user_id = p.user_id
          AND dm.role IN ('manager', 'supervisor')
        )
      )
    GROUP BY p.user_id
    ORDER BY COUNT(c.id) ASC, RANDOM()
    LIMIT 1;
    
    -- If no supervisor/manager found, fallback to least_busy
    IF v_selected_agent_id IS NULL THEN
      SELECT p.user_id INTO v_selected_agent_id
      FROM profiles p
      LEFT JOIN conversations c 
        ON c.assigned_agent_id = p.user_id 
        AND c.status = 'open' 
        AND c.account_id = v_account_id
      WHERE p.account_id = v_account_id
        AND p.is_suspended = false
        AND (
          v_department_id IS NULL OR 
          EXISTS (
            SELECT 1 FROM department_members dm 
            WHERE dm.department_id = v_department_id 
            AND dm.user_id = p.user_id
          )
        )
      GROUP BY p.user_id
      ORDER BY COUNT(c.id) ASC, RANDOM()
      LIMIT 1;
    END IF;
  ELSE
    -- Default to least_busy just in case
    SELECT p.user_id INTO v_selected_agent_id
    FROM profiles p
    LEFT JOIN conversations c 
      ON c.assigned_agent_id = p.user_id 
      AND c.status = 'open' 
      AND c.account_id = v_account_id
    WHERE p.account_id = v_account_id
      AND p.is_suspended = false
      AND (
        v_department_id IS NULL OR 
        EXISTS (
          SELECT 1 FROM department_members dm 
          WHERE dm.department_id = v_department_id 
          AND dm.user_id = p.user_id
        )
      )
    GROUP BY p.user_id
    ORDER BY COUNT(c.id) ASC, RANDOM()
    LIMIT 1;
  END IF;

  -- 4. If an agent is found, assign the conversation
  IF v_selected_agent_id IS NOT NULL THEN
    UPDATE conversations
    SET assigned_agent_id = v_selected_agent_id
    WHERE id = p_conversation_id;
  END IF;

  RETURN v_selected_agent_id;
END;
$$;
