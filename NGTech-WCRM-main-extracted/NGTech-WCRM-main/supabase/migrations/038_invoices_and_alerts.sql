-- ============================================================
-- 038_invoices_and_alerts.sql — Growth Features Additions
--
-- Adds tables for manual invoicing and usage alert tracking.
-- ============================================================

-- ============================================================
-- 1. INVOICES
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status_enum') THEN
    CREATE TYPE invoice_status_enum AS ENUM ('unpaid', 'paid', 'overdue');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS invoices (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id        UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount            NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status            invoice_status_enum NOT NULL DEFAULT 'unpaid',
  issue_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date          DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_account ON invoices(account_id, issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Platform Admin full access; Account members can only read their own invoices
DROP POLICY IF EXISTS invoices_select ON invoices;
CREATE POLICY invoices_select ON invoices FOR SELECT USING (
  is_account_member(account_id) OR is_platform_admin()
);

DROP POLICY IF EXISTS invoices_insert ON invoices;
CREATE POLICY invoices_insert ON invoices FOR INSERT WITH CHECK (
  is_platform_admin()
);

DROP POLICY IF EXISTS invoices_update ON invoices;
CREATE POLICY invoices_update ON invoices FOR UPDATE USING (
  is_platform_admin()
) WITH CHECK (
  is_platform_admin()
);

DROP POLICY IF EXISTS invoices_delete ON invoices;
CREATE POLICY invoices_delete ON invoices FOR DELETE USING (
  is_platform_admin()
);

-- ============================================================
-- 2. USAGE ALERTS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_type_enum') THEN
    CREATE TYPE alert_type_enum AS ENUM (
      'contact_80', 'contact_100',
      'message_80', 'message_100'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS account_alerts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id        UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  alert_type        alert_type_enum NOT NULL,
  month             DATE NOT NULL, -- The billing month this alert was fired for (1st of the month)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure we only record one alert of a specific type per account per month
  UNIQUE(account_id, alert_type, month)
);

CREATE INDEX IF NOT EXISTS idx_alerts_account ON account_alerts(account_id, month DESC);

ALTER TABLE account_alerts ENABLE ROW LEVEL SECURITY;

-- Service role will insert these, so we only need SELECT policies
DROP POLICY IF EXISTS alerts_select ON account_alerts;
CREATE POLICY alerts_select ON account_alerts FOR SELECT USING (
  is_account_member(account_id) OR is_platform_admin()
);
