-- ============================================================
-- 040_dynamic_pricing_plans.sql
-- ============================================================

-- 1. Create the new pricing_plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  annual_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  max_contacts INTEGER NOT NULL DEFAULT 500,
  max_messages_pm INTEGER NOT NULL DEFAULT 1000,
  user_limits INTEGER NOT NULL DEFAULT 1,
  automation_limits INTEGER NOT NULL DEFAULT 0,
  api_limits INTEGER NOT NULL DEFAULT 0,
  chatbot_limits INTEGER NOT NULL DEFAULT 0,
  storage_limits_mb INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  badge_color TEXT NOT NULL DEFAULT 'bg-muted text-muted-foreground',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY pricing_plans_select ON pricing_plans FOR SELECT USING (true);
CREATE POLICY pricing_plans_all ON pricing_plans FOR ALL USING (is_platform_admin());

-- Insert defaults
INSERT INTO pricing_plans (slug, name, description, max_contacts, max_messages_pm, badge_color, sort_order)
VALUES 
  ('free', 'Free', 'Try the platform with basic limits.', 500, 1000, 'bg-muted text-muted-foreground', 1),
  ('starter', 'Starter', 'For small teams getting started.', 2000, 5000, 'bg-blue-500/15 text-blue-400', 2),
  ('pro', 'Pro', 'For growing businesses.', 10000, 30000, 'bg-violet-500/15 text-violet-400', 3),
  ('enterprise', 'Enterprise', 'Unlimited — custom invoicing.', -1, -1, 'bg-amber-500/15 text-amber-400', 4)
ON CONFLICT (slug) DO NOTHING;

-- 2. Alter `accounts.plan` from ENUM to TEXT
ALTER TABLE accounts ALTER COLUMN plan DROP DEFAULT;
ALTER TABLE accounts ALTER COLUMN plan TYPE TEXT USING plan::TEXT;
ALTER TABLE accounts ALTER COLUMN plan SET DEFAULT 'free';

-- 3. Add a foreign key to pricing_plans.slug
ALTER TABLE accounts ADD CONSTRAINT fk_accounts_plan FOREIGN KEY (plan) REFERENCES pricing_plans(slug) ON UPDATE CASCADE;

-- 4. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  plan_slug TEXT NOT NULL REFERENCES pricing_plans(slug) ON UPDATE CASCADE,
  status TEXT NOT NULL DEFAULT 'active', -- active, past_due, canceled
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- monthly, annual
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  gateway_subscription_id TEXT, -- e.g., sub_12345 from Razorpay/Stripe
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT USING (is_account_member(account_id) OR is_platform_admin());
CREATE POLICY subscriptions_all ON subscriptions FOR ALL USING (is_platform_admin());

-- 5. Invoices Table
CREATE TABLE IF NOT EXISTS platform_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'paid', -- open, paid, void, uncollectible
  invoice_pdf_url TEXT,
  gateway_invoice_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE platform_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY platform_invoices_select ON platform_invoices FOR SELECT USING (is_account_member(account_id) OR is_platform_admin());
CREATE POLICY platform_invoices_all ON platform_invoices FOR ALL USING (is_platform_admin());

-- 6. Leads table for Marketing Ingestion
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  lead_source TEXT,
  campaign_name TEXT,
  landing_page_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  team_size TEXT,
  message_volume TEXT,
  current_crm TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_select ON leads FOR SELECT USING (is_platform_admin());
CREATE POLICY leads_all ON leads FOR ALL USING (is_platform_admin());
