-- ============================================================
-- 069_contact_notes_media.sql
--
-- Adds support for attaching files to contact notes in the CRM.
-- - Adds `media_url`, `media_name`, and `media_type` columns.
-- - Drops the NOT NULL constraint on `note_text` so a note can
--   exist purely to hold a file attachment.
-- ============================================================

ALTER TABLE contact_notes
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_name TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE contact_notes
  ALTER COLUMN note_text DROP NOT NULL;
