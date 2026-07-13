-- ============================================================
-- 044_admin_tools.sql
-- Adds phone number masking configuration to the accounts table.
-- ============================================================

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS mask_agent_phones BOOLEAN NOT NULL DEFAULT false;

-- Notify PostgREST schema cache to reload so the new column is exposed
NOTIFY pgrst, 'reload schema';
