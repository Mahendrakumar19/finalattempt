-- ============================================================
-- 054_trusted_clients_testimonials.sql
-- 
-- Extends the saas_trusted_clients table to include testimonials.
-- ============================================================

ALTER TABLE public.saas_trusted_clients
  ADD COLUMN IF NOT EXISTS testimonial_text text,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS author_role text;

-- Notify PostgREST schema cache to reload
NOTIFY pgrst, 'reload schema';
