-- 061_analytics_v2.sql

-- 1. Add ai_language to conversations to store the latest detected language
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS ai_language VARCHAR(50);

-- 2. Add language and intent_category to ai_analytics_events
ALTER TABLE ai_analytics_events
  ADD COLUMN IF NOT EXISTS language VARCHAR(50),
  ADD COLUMN IF NOT EXISTS intent_category VARCHAR(100);
