-- ============================================================
-- 043_agent_data_isolation.sql
-- Implements strict Agent Data Isolation
-- Admins see all, Agents see only data where user_id = auth.uid()
-- ============================================================

-- Add account_id to tasks if missing (from 031_tasks.sql)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;

-- Backfill tasks.account_id via profiles
UPDATE tasks t
SET account_id = p.account_id
FROM profiles p
WHERE t.user_id = p.user_id
  AND t.account_id IS NULL;

-- Not Null after backfill
ALTER TABLE tasks ALTER COLUMN account_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_account ON tasks(account_id);

-- Replace old policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'contacts', 'contact_notes', 'conversations', 'deals',
        'broadcasts', 'tasks', 'automation_logs', 'flow_runs',
        'contact_tags', 'contact_custom_values', 'messages', 'message_reactions'
      ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ---------------- contacts ----------------
CREATE POLICY contacts_select ON contacts FOR SELECT USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY contacts_insert ON contacts FOR INSERT WITH CHECK (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY contacts_update ON contacts FOR UPDATE USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY contacts_delete ON contacts FOR DELETE USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);

-- ---------------- contact_notes ----------------
CREATE POLICY contact_notes_select ON contact_notes FOR SELECT USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY contact_notes_insert ON contact_notes FOR INSERT WITH CHECK (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY contact_notes_update ON contact_notes FOR UPDATE USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY contact_notes_delete ON contact_notes FOR DELETE USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);

-- ---------------- conversations ----------------
CREATE POLICY conversations_select ON conversations FOR SELECT USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY conversations_insert ON conversations FOR INSERT WITH CHECK (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY conversations_update ON conversations FOR UPDATE USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY conversations_delete ON conversations FOR DELETE USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);

-- ---------------- deals ----------------
CREATE POLICY deals_select ON deals FOR SELECT USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY deals_insert ON deals FOR INSERT WITH CHECK (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY deals_update ON deals FOR UPDATE USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY deals_delete ON deals FOR DELETE USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);

-- ---------------- broadcasts ----------------
CREATE POLICY broadcasts_select ON broadcasts FOR SELECT USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY broadcasts_insert ON broadcasts FOR INSERT WITH CHECK (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY broadcasts_update ON broadcasts FOR UPDATE USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY broadcasts_delete ON broadcasts FOR DELETE USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);

-- ---------------- tasks ----------------
CREATE POLICY tasks_select ON tasks FOR SELECT USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY tasks_insert ON tasks FOR INSERT WITH CHECK (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY tasks_update ON tasks FOR UPDATE USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);
CREATE POLICY tasks_delete ON tasks FOR DELETE USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);

-- ---------------- automation_logs ----------------
CREATE POLICY automation_logs_select ON automation_logs FOR SELECT USING (
  is_account_member(account_id, 'admin') OR (is_account_member(account_id, 'agent') AND user_id = auth.uid())
);

-- ---------------- flow_runs ----------------
-- flow_runs doesn't have a user_id, it relies on contact ownership
CREATE POLICY flow_runs_select ON flow_runs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM contacts c
    WHERE c.id = flow_runs.contact_id
      AND (is_account_member(c.account_id, 'admin') OR (is_account_member(c.account_id, 'agent') AND c.user_id = auth.uid()))
  )
);

-- ---------------- child tables ----------------
CREATE POLICY contact_tags_select ON contact_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM contacts c WHERE c.id = contact_tags.contact_id AND (is_account_member(c.account_id, 'admin') OR (is_account_member(c.account_id, 'agent') AND c.user_id = auth.uid())))
);
CREATE POLICY contact_tags_modify ON contact_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM contacts c WHERE c.id = contact_tags.contact_id AND (is_account_member(c.account_id, 'admin') OR (is_account_member(c.account_id, 'agent') AND c.user_id = auth.uid())))
) WITH CHECK (
  EXISTS (SELECT 1 FROM contacts c WHERE c.id = contact_tags.contact_id AND (is_account_member(c.account_id, 'admin') OR (is_account_member(c.account_id, 'agent') AND c.user_id = auth.uid())))
);

CREATE POLICY contact_custom_values_select ON contact_custom_values FOR SELECT USING (
  EXISTS (SELECT 1 FROM contacts c WHERE c.id = contact_custom_values.contact_id AND (is_account_member(c.account_id, 'admin') OR (is_account_member(c.account_id, 'agent') AND c.user_id = auth.uid())))
);
CREATE POLICY contact_custom_values_modify ON contact_custom_values FOR ALL USING (
  EXISTS (SELECT 1 FROM contacts c WHERE c.id = contact_custom_values.contact_id AND (is_account_member(c.account_id, 'admin') OR (is_account_member(c.account_id, 'agent') AND c.user_id = auth.uid())))
) WITH CHECK (
  EXISTS (SELECT 1 FROM contacts c WHERE c.id = contact_custom_values.contact_id AND (is_account_member(c.account_id, 'admin') OR (is_account_member(c.account_id, 'agent') AND c.user_id = auth.uid())))
);

CREATE POLICY messages_select ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (is_account_member(c.account_id, 'admin') OR (is_account_member(c.account_id, 'agent') AND c.user_id = auth.uid())))
);
CREATE POLICY messages_modify ON messages FOR ALL USING (
  EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (is_account_member(c.account_id, 'admin') OR (is_account_member(c.account_id, 'agent') AND c.user_id = auth.uid())))
) WITH CHECK (
  EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (is_account_member(c.account_id, 'admin') OR (is_account_member(c.account_id, 'agent') AND c.user_id = auth.uid())))
);

CREATE POLICY message_reactions_select ON message_reactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE m.id = message_reactions.message_id
      AND (is_account_member(c.account_id, 'admin') OR (is_account_member(c.account_id, 'agent') AND c.user_id = auth.uid()))
  )
);
CREATE POLICY message_reactions_modify ON message_reactions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE m.id = message_reactions.message_id
      AND (is_account_member(c.account_id, 'admin') OR (is_account_member(c.account_id, 'agent') AND c.user_id = auth.uid()))
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE m.id = message_reactions.message_id
      AND (is_account_member(c.account_id, 'admin') OR (is_account_member(c.account_id, 'agent') AND c.user_id = auth.uid()))
  )
);
