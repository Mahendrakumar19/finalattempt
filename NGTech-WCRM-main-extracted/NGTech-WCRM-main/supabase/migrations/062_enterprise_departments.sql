-- 062_enterprise_departments.sql

-- 1. Upgrade departments table with enterprise fields
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS queue_strategy TEXT DEFAULT 'round_robin',
  ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_configuration JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}'::jsonb;

-- 2. Add an index for status to speed up routing queries
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);

-- 3. Update department_members to include a role (agent, supervisor, manager)
ALTER TABLE department_members
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'agent';

-- 4. Create an audit log table for departments
CREATE TABLE IF NOT EXISTS department_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dept_audit_logs_dept ON department_audit_logs(department_id);

ALTER TABLE department_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dept_audit_logs_select ON department_audit_logs;
CREATE POLICY dept_audit_logs_select ON department_audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM departments d WHERE d.id = department_audit_logs.department_id AND is_account_member(d.account_id))
);

DROP POLICY IF EXISTS dept_audit_logs_insert ON department_audit_logs;
CREATE POLICY dept_audit_logs_insert ON department_audit_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM departments d WHERE d.id = department_audit_logs.department_id AND is_account_member(d.account_id, 'admin'))
);
