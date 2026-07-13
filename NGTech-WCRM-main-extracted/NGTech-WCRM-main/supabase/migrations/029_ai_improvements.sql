-- Add is_bot_paused to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_bot_paused BOOLEAN DEFAULT false;

-- Add ai_knowledge_base to whatsapp_config
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS ai_knowledge_base TEXT DEFAULT '';
