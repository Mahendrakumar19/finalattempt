-- Migration to add AI analysis columns to conversations table

ALTER TABLE conversations
ADD COLUMN ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
ADD COLUMN ai_lead_score TEXT CHECK (ai_lead_score IN ('cold', 'warm', 'hot'));
