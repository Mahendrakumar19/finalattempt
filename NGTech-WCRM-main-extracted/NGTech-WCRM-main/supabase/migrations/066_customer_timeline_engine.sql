-- ============================================================
-- 066_customer_timeline_engine.sql
-- Core Activity Logger and Customer 360 Timeline Engine
-- ============================================================

-- 1. Enhance the customer_activities table
ALTER TABLE customer_activities 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'system',
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS is_milestone BOOLEAN DEFAULT FALSE;

-- Ensure an index on category for fast filtering
CREATE INDEX IF NOT EXISTS idx_customer_activities_category ON customer_activities(category);
CREATE INDEX IF NOT EXISTS idx_customer_activities_milestone ON customer_activities(is_milestone);
CREATE INDEX IF NOT EXISTS idx_customer_activities_created_at ON customer_activities(created_at DESC);

-- 2. Central Activity Logger RPC
-- This is the single source of truth for logging events, callable from Edge Functions or Triggers.
CREATE OR REPLACE FUNCTION log_customer_activity(
    p_account_id UUID,
    p_contact_id UUID,
    p_actor_id UUID,
    p_category TEXT,
    p_activity_type TEXT,
    p_title TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_is_milestone BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO customer_activities (
        account_id, contact_id, actor_id, category, activity_type, title, description, metadata, is_milestone
    ) VALUES (
        p_account_id, p_contact_id, p_actor_id, p_category, p_activity_type, p_title, p_description, p_metadata, p_is_milestone
    ) RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. Database Triggers for Core Modules
-- Automates logging so future developers don't have to manually log standard events.
-- ============================================================

-- A. CONTACT CREATED (Milestone)
CREATE OR REPLACE FUNCTION trg_log_contact_created() RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_customer_activity(
        NEW.account_id,
        NEW.id,
        auth.uid(),
        'system',
        'contact_created',
        'Contact Created',
        'A new lead profile was created in the system.',
        jsonb_build_object('name', NEW.name, 'phone', NEW.phone, 'source', 'crm'),
        TRUE -- Milestone
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_contact_created ON contacts;
CREATE TRIGGER trigger_log_contact_created
    AFTER INSERT ON contacts
    FOR EACH ROW EXECUTE FUNCTION trg_log_contact_created();


-- B. DEAL CREATED & WON (Milestone)
CREATE OR REPLACE FUNCTION trg_log_deal_events() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_customer_activity(
            NEW.account_id,
            NEW.contact_id,
            auth.uid(),
            'sales',
            'deal_created',
            'Deal Created',
            'A new deal "' || NEW.title || '" was added to the pipeline.',
            jsonb_build_object('deal_id', NEW.id, 'value', NEW.value, 'currency', NEW.currency),
            FALSE
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        IF NEW.status = 'won' THEN
            PERFORM log_customer_activity(
                NEW.account_id,
                NEW.contact_id,
                auth.uid(),
                'sales',
                'deal_won',
                'Deal Won! 🎉',
                'The deal "' || NEW.title || '" was successfully closed.',
                jsonb_build_object('deal_id', NEW.id, 'value', NEW.value, 'currency', NEW.currency),
                TRUE -- Milestone
            );
        ELSIF NEW.status = 'lost' THEN
            PERFORM log_customer_activity(
                NEW.account_id,
                NEW.contact_id,
                auth.uid(),
                'sales',
                'deal_lost',
                'Deal Lost',
                'The deal "' || NEW.title || '" was closed as lost.',
                jsonb_build_object('deal_id', NEW.id),
                FALSE
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_deal_events ON deals;
CREATE TRIGGER trigger_log_deal_events
    AFTER INSERT OR UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION trg_log_deal_events();


-- C. APPOINTMENTS (Meetings)
CREATE OR REPLACE FUNCTION trg_log_appointment_events() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_customer_activity(
            NEW.account_id,
            NEW.contact_id,
            auth.uid(),
            'meetings',
            'meeting_scheduled',
            'Meeting Scheduled',
            'Appointment "' || NEW.title || '" scheduled for ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY HH12:MI AM'),
            jsonb_build_object('appointment_id', NEW.id, 'duration', NEW.duration_minutes),
            FALSE
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        PERFORM log_customer_activity(
            NEW.account_id,
            NEW.contact_id,
            auth.uid(),
            'meetings',
            'meeting_' || NEW.status,
            'Meeting ' || initcap(NEW.status),
            'Appointment "' || NEW.title || '" was marked as ' || NEW.status || '.',
            jsonb_build_object('appointment_id', NEW.id),
            FALSE
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_appointment_events ON appointments;
CREATE TRIGGER trigger_log_appointment_events
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION trg_log_appointment_events();


-- D. SUPPORT TICKETS
CREATE OR REPLACE FUNCTION trg_log_ticket_events() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_customer_activity(
            NEW.account_id,
            NEW.contact_id,
            auth.uid(),
            'support',
            'ticket_created',
            'Ticket Created',
            'Support ticket "' || NEW.title || '" was opened.',
            jsonb_build_object('ticket_id', NEW.id, 'priority', NEW.priority),
            FALSE
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'resolved' THEN
        PERFORM log_customer_activity(
            NEW.account_id,
            NEW.contact_id,
            auth.uid(),
            'support',
            'ticket_resolved',
            'Ticket Resolved',
            'Support ticket "' || NEW.title || '" was successfully resolved.',
            jsonb_build_object('ticket_id', NEW.id),
            FALSE
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_ticket_events ON support_tickets;
CREATE TRIGGER trigger_log_ticket_events
    AFTER INSERT OR UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION trg_log_ticket_events();


-- E. TASKS
CREATE OR REPLACE FUNCTION trg_log_task_events() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_customer_activity(
            NEW.account_id,
            NEW.contact_id,
            auth.uid(),
            'tasks',
            'task_created',
            'Task: ' || NEW.title,
            COALESCE(NEW.description, 'A new task was created.'),
            jsonb_build_object('task_id', NEW.id, 'status', NEW.status),
            FALSE
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'completed' THEN
        PERFORM log_customer_activity(
            NEW.account_id,
            NEW.contact_id,
            auth.uid(),
            'tasks',
            'task_completed',
            'Task Completed: ' || NEW.title,
            'Action taken: ' || COALESCE(NEW.description, 'Task was marked as done.'),
            jsonb_build_object('task_id', NEW.id, 'status', NEW.status, 'completed_at', NOW()),
            FALSE
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_task_events ON tasks;
CREATE TRIGGER trigger_log_task_events
    AFTER INSERT OR UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION trg_log_task_events();
