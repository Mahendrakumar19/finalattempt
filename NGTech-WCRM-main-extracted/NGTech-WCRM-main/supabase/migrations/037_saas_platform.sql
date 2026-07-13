-- ============================================================
-- 037_saas_platform.sql — SaaS Platform Layer
--
-- Adds subscription plans, account status, usage tracking, and
-- a platform super-admin flag to turn wacrm into a multi-tenant
-- SaaS platform where the operator can manage all client accounts.
--
-- Plans:
--   free       — 500 contacts, 1 000 messages/month
--   starter    — 2 000 contacts, 5 000 messages/month
--   pro        — 10 000 contacts, 30 000 messages/month
--   enterprise — unlimited (-1)
--
-- Status lifecycle:
--   active → suspended (by admin) → active
--   active → cancelled (irrecoverable except by admin reset)
--
-- Idempotent — safe to run multiple times.
-- ============================================================

-- ============================================================
-- 1. PLAN + STATUS ENUM / COLUMNS ON ACCOUNTS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_plan_enum') THEN
    CREATE TYPE account_plan_enum AS ENUM ('free', 'starter', 'pro', 'enterprise');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status_enum') THEN
    CREATE TYPE account_status_enum AS ENUM ('active', 'suspended', 'cancelled');
  END IF;
END $$;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS plan            account_plan_enum   NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS status          account_status_enum NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS trial_ends_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes           TEXT,           -- operator internal notes / invoice refs
  ADD COLUMN IF NOT EXISTS max_contacts    INTEGER         NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS max_messages_pm INTEGER         NOT NULL DEFAULT 1000; -- per month

-- ============================================================
-- 2. PLATFORM SUPER-ADMIN FLAG ON PROFILES
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- 3. MONTHLY USAGE TRACKING
--
-- One row per (account, calendar month). Counters are incremented
-- by server-side API routes — not via client triggers — so they
-- use service-role and bypass RLS.
-- ============================================================
CREATE TABLE IF NOT EXISTS account_usage (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id        UUID         NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  month             DATE         NOT NULL,   -- always the 1st of the month
  messages_sent     INTEGER      NOT NULL DEFAULT 0,
  contacts_count    INTEGER      NOT NULL DEFAULT 0,  -- snapshot, not delta
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, month)
);

CREATE INDEX IF NOT EXISTS idx_account_usage_account ON account_usage(account_id, month DESC);

ALTER TABLE account_usage ENABLE ROW LEVEL SECURITY;

-- Platform admin can see all usage; account members can see their own.
DROP POLICY IF EXISTS account_usage_select ON account_usage;
CREATE POLICY account_usage_select ON account_usage FOR SELECT USING (
  is_account_member(account_id)
);

-- ============================================================
-- 4. SUSPENDED ACCOUNT GUARD
--
-- A SECURITY DEFINER function that returns TRUE if the current
-- user's account is active. Used by the middleware to gate
-- dashboard access and by plan-limit helpers in API routes.
-- ============================================================
CREATE OR REPLACE FUNCTION is_account_active(target_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM accounts
    WHERE id = target_account_id AND status = 'active'
  );
$$;

ALTER FUNCTION is_account_active(UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION is_account_active(UUID) TO authenticated, service_role;

-- ============================================================
-- 5. BACKFILL — ensure every existing account has sensible defaults
-- (plan + status were added with defaults so this is a no-op if
--  the column already has the default, but explicit for clarity)
-- ============================================================
UPDATE accounts
SET
  plan   = 'free',
  status = 'active'
WHERE plan IS NULL OR status IS NULL;

-- ============================================================
-- 6. INDEXES for operator queries (list all accounts by plan/status)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_accounts_plan   ON accounts(plan);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_created ON accounts(created_at DESC);

-- ============================================================
-- 7. PLATFORM ADMIN RLS
--
-- Platform admins need to read/write all accounts and profiles.
-- We do this via a helper that checks the caller's own profile
-- for is_platform_admin = true (SECURITY DEFINER so it can
-- read profiles without recursion).
-- ============================================================
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT is_platform_admin FROM profiles WHERE user_id = auth.uid()
  ), false);
$$;

ALTER FUNCTION is_platform_admin() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION is_platform_admin() TO authenticated, service_role;

-- Extend existing accounts RLS to allow platform admins full access
DROP POLICY IF EXISTS accounts_select ON accounts;
DROP POLICY IF EXISTS accounts_update ON accounts;
DROP POLICY IF EXISTS accounts_platform_admin ON accounts;

CREATE POLICY accounts_select ON accounts FOR SELECT
  USING (is_account_member(id) OR is_platform_admin());

CREATE POLICY accounts_update ON accounts FOR UPDATE
  USING (is_account_member(id, 'admin') OR is_platform_admin())
  WITH CHECK (is_account_member(id, 'admin') OR is_platform_admin());

-- Platform admin can also INSERT new accounts (admin-created clients)
DROP POLICY IF EXISTS accounts_insert ON accounts;
CREATE POLICY accounts_insert ON accounts FOR INSERT
  WITH CHECK (is_platform_admin());

-- Platform admin can see all profiles (needed for the clients list)
DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (auth.uid() = user_id OR is_account_member(account_id) OR is_platform_admin());
