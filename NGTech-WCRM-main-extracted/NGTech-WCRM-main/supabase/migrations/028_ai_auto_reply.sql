-- Add AI Auto-Reply settings to whatsapp_config table
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS ai_auto_reply_enabled BOOLEAN DEFAULT false;
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS ai_auto_reply_prompt TEXT DEFAULT 'You are a helpful customer support assistant for this business.';
