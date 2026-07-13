-- ============================================================
-- 042_lead_capture_fields.sql
-- ============================================================
-- Extends the existing `contacts` table (the CRM Lead table) 
-- to natively support advanced SaaS marketing and UTM fields 
-- without requiring a secondary database.
-- ============================================================

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS team_size TEXT,
  ADD COLUMN IF NOT EXISTS monthly_message_volume TEXT,
  ADD COLUMN IF NOT EXISTS current_crm_used TEXT,
  
  -- Marketing & Tracking
  ADD COLUMN IF NOT EXISTS lead_source TEXT,
  ADD COLUMN IF NOT EXISTS campaign_name TEXT,
  ADD COLUMN IF NOT EXISTS landing_page_url TEXT,
  
  -- UTM Parameters
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  
  -- Technical Context
  ADD COLUMN IF NOT EXISTS device_type TEXT;
