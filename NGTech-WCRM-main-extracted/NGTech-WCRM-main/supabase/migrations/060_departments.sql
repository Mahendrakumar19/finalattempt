-- 060_departments.sql

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_account ON departments(account_id);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS departments_select ON departments;
CREATE POLICY departments_select ON departments FOR SELECT USING (is_account_member(account_id));

DROP POLICY IF EXISTS departments_insert ON departments;
CREATE POLICY departments_insert ON departments FOR INSERT WITH CHECK (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS departments_update ON departments;
CREATE POLICY departments_update ON departments FOR UPDATE USING (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS departments_delete ON departments;
CREATE POLICY departments_delete ON departments FOR DELETE USING (is_account_member(account_id, 'admin'));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_departments_updated_at ON departments;
CREATE TRIGGER set_departments_updated_at 
  BEFORE UPDATE ON departments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 2. Create department_members table (Many-to-Many)
CREATE TABLE IF NOT EXISTS department_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_department_members_dept ON department_members(department_id);
CREATE INDEX IF NOT EXISTS idx_department_members_user ON department_members(user_id);

ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
-- For security, members can be seen by account members
DROP POLICY IF EXISTS department_members_select ON department_members;
CREATE POLICY department_members_select ON department_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM departments d WHERE d.id = department_members.department_id AND is_account_member(d.account_id))
);

DROP POLICY IF EXISTS department_members_modify ON department_members;
CREATE POLICY department_members_modify ON department_members FOR ALL USING (
  EXISTS (SELECT 1 FROM departments d WHERE d.id = department_members.department_id AND is_account_member(d.account_id, 'admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM departments d WHERE d.id = department_members.department_id AND is_account_member(d.account_id, 'admin'))
);

-- 3. Add department_id to conversations
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- 4. Update the Smart Auto-Assignment RPC to respect department routing
CREATE OR REPLACE FUNCTION auto_assign_conversation(p_conversation_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_department_id UUID;
  v_selected_agent_id UUID;
BEGIN
  -- 1. Get the account_id and department_id for the conversation
  SELECT account_id, department_id INTO v_account_id, v_department_id
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_account_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Find the active agent with the fewest open conversations
  -- If v_department_id is NOT NULL, restrict to agents in that department.
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

-- 5. Seed requested departments for all existing accounts
INSERT INTO departments (account_id, name)
SELECT id, 'Sales' FROM accounts;

INSERT INTO departments (account_id, name)
SELECT id, 'Technical Consultant' FROM accounts;

INSERT INTO departments (account_id, name)
SELECT id, 'Customer Support' FROM accounts;

INSERT INTO departments (account_id, name)
SELECT id, 'Accounts' FROM accounts;

INSERT INTO departments (account_id, name)
SELECT id, 'Management' FROM accounts;
