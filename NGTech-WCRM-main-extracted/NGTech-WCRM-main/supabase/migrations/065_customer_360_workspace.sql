-- ============================================================
-- 065_customer_360_workspace.sql
-- Complete Customer 360 Workspace Schema
-- ============================================================

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_account ON support_tickets(account_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_contact ON support_tickets(contact_id);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account members can manage tickets" ON support_tickets FOR ALL USING (is_account_member(account_id));


-- ============================================================
-- CUSTOMER PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_projects_account ON customer_projects(account_id);
CREATE INDEX IF NOT EXISTS idx_customer_projects_contact ON customer_projects(contact_id);

ALTER TABLE customer_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account members can manage projects" ON customer_projects FOR ALL USING (is_account_member(account_id));


-- ============================================================
-- APPOINTMENTS (Enhancement of meetings)
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_account ON appointments(account_id);
CREATE INDEX IF NOT EXISTS idx_appointments_contact ON appointments(contact_id);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account members can manage appointments" ON appointments FOR ALL USING (is_account_member(account_id));


-- ============================================================
-- CUSTOMER ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    order_number TEXT,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_orders_account ON customer_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_contact ON customer_orders(contact_id);

ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account members can manage orders" ON customer_orders FOR ALL USING (is_account_member(account_id));


-- ============================================================
-- CUSTOMER INVOICES & PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    order_id UUID REFERENCES customer_orders(id) ON DELETE SET NULL,
    invoice_number TEXT,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_invoices_account ON customer_invoices(account_id);
CREATE INDEX IF NOT EXISTS idx_customer_invoices_contact ON customer_invoices(contact_id);

ALTER TABLE customer_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account members can manage customer invoices" ON customer_invoices FOR ALL USING (is_account_member(account_id));


CREATE TABLE IF NOT EXISTS customer_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES customer_invoices(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_payments_account ON customer_payments(account_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_contact ON customer_payments(contact_id);

ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account members can manage customer payments" ON customer_payments FOR ALL USING (is_account_member(account_id));


-- ============================================================
-- UNIFIED ACTIVITY HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL, -- e.g., 'quote_sent', 'ticket_created', 'stage_changed'
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_activities_account ON customer_activities(account_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_contact ON customer_activities(contact_id);

ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account members can manage activities" ON customer_activities FOR ALL USING (is_account_member(account_id));
