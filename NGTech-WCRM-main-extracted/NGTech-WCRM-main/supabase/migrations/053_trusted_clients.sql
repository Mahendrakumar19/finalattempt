-- ============================================================
-- 053_trusted_clients.sql
-- 
-- Adds a saas_trusted_clients table for the super admin
-- to manage the 'Trusted By' section on the marketing page.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.saas_trusted_clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  url text,
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Turn on RLS
ALTER TABLE public.saas_trusted_clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active trusted clients" ON public.saas_trusted_clients;
DROP POLICY IF EXISTS "Platform admins can manage trusted clients" ON public.saas_trusted_clients;

-- Allow public read access (for marketing page)
CREATE POLICY "Public can view active trusted clients" 
ON public.saas_trusted_clients 
FOR SELECT 
USING (is_active = true);

-- Allow full access for platform admins
CREATE POLICY "Platform admins can manage trusted clients" 
ON public.saas_trusted_clients 
FOR ALL 
USING (public.is_platform_admin());

-- Seed with initial placeholders so the site doesn't appear empty immediately
INSERT INTO public.saas_trusted_clients (name, url, order_index)
VALUES 
  ('Acme Corp', null, 0),
  ('GlobalTech', null, 1),
  ('EduSmart', null, 2),
  ('RealEstate Co', null, 3),
  ('HealthPlus', null, 4)
ON CONFLICT DO NOTHING;

-- Notify PostgREST schema cache to reload
NOTIFY pgrst, 'reload schema';
