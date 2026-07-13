-- ============================================================
-- 055_saas_pricing_plans.sql — Dynamic Pricing Plans
-- ============================================================

CREATE TABLE IF NOT EXISTS public.saas_pricing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    monthly_price NUMERIC NOT NULL DEFAULT 0,
    annual_price NUMERIC NOT NULL DEFAULT 0,
    discount_percent NUMERIC NOT NULL DEFAULT 0,
    max_contacts INTEGER NOT NULL DEFAULT 0,
    max_messages_pm INTEGER NOT NULL DEFAULT 0,
    features JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Setup RLS
ALTER TABLE public.saas_pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active plans" ON public.saas_pricing_plans;
CREATE POLICY "Public can read active plans" ON public.saas_pricing_plans
  FOR SELECT USING (is_active = true OR is_platform_admin());

DROP POLICY IF EXISTS "Platform admins full access" ON public.saas_pricing_plans;
CREATE POLICY "Platform admins full access" ON public.saas_pricing_plans
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Seed initial plans if they don't exist
INSERT INTO public.saas_pricing_plans (slug, name, description, monthly_price, annual_price, discount_percent, max_contacts, max_messages_pm, features, sort_order)
VALUES
('free', 'Free', 'Try the platform with basic limits.', 0, 0, 0, 500, 1000, '["Basic CRM features", "1 Team Member"]', 1),
('starter', 'Starter', 'For small teams getting started.', 2499, 24990, 0, 2000, 5000, '["Advanced CRM Workflows", "Shared Team Inbox"]', 2),
('pro', 'Pro', 'For growing businesses.', 5999, 59990, 0, 10000, 30000, '["Advanced CRM Workflows", "Shared Team Inbox", "AI Chatbot Builder", "Dedicated Account Manager"]', 3),
('enterprise', 'Enterprise', 'Unlimited — custom invoicing.', 0, 0, 0, -1, -1, '["Everything in Pro", "Unlimited Contacts", "Custom SLAs"]', 4)
ON CONFLICT (slug) DO NOTHING;

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_saas_pricing_plans_updated_at ON public.saas_pricing_plans;
CREATE TRIGGER trigger_saas_pricing_plans_updated_at
BEFORE UPDATE ON public.saas_pricing_plans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
