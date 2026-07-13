-- 045_business_hours.sql

-- Add business_hours JSONB to accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{
  "timezone": "UTC",
  "schedule": {
    "monday": { "active": true, "start": "09:00", "end": "17:00" },
    "tuesday": { "active": true, "start": "09:00", "end": "17:00" },
    "wednesday": { "active": true, "start": "09:00", "end": "17:00" },
    "thursday": { "active": true, "start": "09:00", "end": "17:00" },
    "friday": { "active": true, "start": "09:00", "end": "17:00" },
    "saturday": { "active": false, "start": "09:00", "end": "17:00" },
    "sunday": { "active": false, "start": "09:00", "end": "17:00" }
  }
}';
