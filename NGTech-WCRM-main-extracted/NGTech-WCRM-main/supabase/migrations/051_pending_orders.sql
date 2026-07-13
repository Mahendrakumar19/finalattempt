-- ============================================================
-- 051_pending_orders.sql
-- Creates a table to store manual checkout / bank transfer orders.
-- ============================================================

CREATE TABLE IF NOT EXISTS pending_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company_name TEXT,
    plan TEXT NOT NULL,
    billing_cycle TEXT NOT NULL,
    price NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_transfer', -- pending_transfer, completed, cancelled
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE pending_orders ENABLE ROW LEVEL SECURITY;

-- Allow insert from anon/authenticated (marketing site checkout)
DROP POLICY IF EXISTS pending_orders_insert ON pending_orders;
CREATE POLICY pending_orders_insert ON pending_orders FOR INSERT WITH CHECK (true);

-- Allow platform admin to view
DROP POLICY IF EXISTS pending_orders_select ON pending_orders;
CREATE POLICY pending_orders_select ON pending_orders FOR SELECT USING (is_platform_admin());

-- Allow platform admin to update
DROP POLICY IF EXISTS pending_orders_update ON pending_orders;
CREATE POLICY pending_orders_update ON pending_orders FOR UPDATE USING (is_platform_admin());
