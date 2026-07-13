-- ============================================================
-- Migration 027: AI Summaries
-- Adds an `ai_summary` column to the `conversations` table
-- to cache LLM-generated summaries.
-- ============================================================

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_summary TEXT;
