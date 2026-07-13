-- ============================================================
-- Add 'delay' node to flow builder and 'paused' status to flow runs
-- ============================================================

-- 1. flow_runs.status — add 'paused'
ALTER TABLE flow_runs
  DROP CONSTRAINT IF EXISTS flow_runs_status_check;

ALTER TABLE flow_runs
  ADD CONSTRAINT flow_runs_status_check
  CHECK (status IN (
    'active',           -- currently awaiting customer input
    'completed',        -- reached an end node naturally
    'handed_off',       -- ended via a handoff node
    'timed_out',        -- swept by the cron after fallback_policy.on_timeout_hours
    'paused_by_agent',  -- an agent manually replied; flow yielded
    'failed',           -- runner hit an unrecoverable error
    'paused'            -- waiting for a delay node to expire
  ));

-- 2. flow_runs.resume_at — column for the delay node
ALTER TABLE flow_runs
  ADD COLUMN IF NOT EXISTS resume_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_flow_runs_paused_resume
  ON flow_runs(resume_at)
  WHERE status = 'paused';

-- 3. flow_nodes.node_type — add 'delay'
ALTER TABLE flow_nodes
  DROP CONSTRAINT IF EXISTS flow_nodes_node_type_check;

ALTER TABLE flow_nodes
  ADD CONSTRAINT flow_nodes_node_type_check
  CHECK (node_type IN (
    'start',
    'send_buttons',
    'send_list',
    'send_message',
    'send_media',
    'collect_input',
    'condition',
    'set_tag',
    'handoff',
    'http_fetch',
    'delay',
    'end'
  ));
