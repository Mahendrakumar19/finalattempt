-- ============================================================
-- Fix for Agent Data Isolation
-- Allows agents to see conversations assigned to them
-- and the contacts associated with those conversations.
-- ============================================================

-- 1. Update conversations policies to allow access if assigned_agent_id = auth.uid()
DROP POLICY IF EXISTS conversations_select ON conversations;
CREATE POLICY conversations_select ON conversations FOR SELECT USING (
  is_account_member(account_id, 'admin') OR 
  (is_account_member(account_id, 'agent') AND (user_id = auth.uid() OR assigned_agent_id = auth.uid()))
);

DROP POLICY IF EXISTS conversations_update ON conversations;
CREATE POLICY conversations_update ON conversations FOR UPDATE USING (
  is_account_member(account_id, 'admin') OR 
  (is_account_member(account_id, 'agent') AND (user_id = auth.uid() OR assigned_agent_id = auth.uid()))
);

DROP POLICY IF EXISTS conversations_insert ON conversations;
CREATE POLICY conversations_insert ON conversations FOR INSERT WITH CHECK (
  is_account_member(account_id, 'admin') OR 
  (is_account_member(account_id, 'agent') AND (user_id = auth.uid() OR assigned_agent_id = auth.uid()))
);

-- 2. Update contacts policies so agents can see the contact if they are assigned to its conversation
DROP POLICY IF EXISTS contacts_select ON contacts;
CREATE POLICY contacts_select ON contacts FOR SELECT USING (
  is_account_member(account_id, 'admin') OR 
  (is_account_member(account_id, 'agent') AND (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.contact_id = contacts.id 
      AND c.assigned_agent_id = auth.uid()
    )
  ))
);

DROP POLICY IF EXISTS contacts_update ON contacts;
CREATE POLICY contacts_update ON contacts FOR UPDATE USING (
  is_account_member(account_id, 'admin') OR 
  (is_account_member(account_id, 'agent') AND (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.contact_id = contacts.id 
      AND c.assigned_agent_id = auth.uid()
    )
  ))
);

-- 3. Update messages policy so agents can read/send messages in their assigned conversations
DROP POLICY IF EXISTS messages_select ON messages;
CREATE POLICY messages_select ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = messages.conversation_id 
    AND (
      is_account_member(c.account_id, 'admin') OR 
      (is_account_member(c.account_id, 'agent') AND (c.user_id = auth.uid() OR c.assigned_agent_id = auth.uid()))
    )
  )
);

DROP POLICY IF EXISTS messages_modify ON messages;
CREATE POLICY messages_modify ON messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = messages.conversation_id 
    AND (
      is_account_member(c.account_id, 'admin') OR 
      (is_account_member(c.account_id, 'agent') AND (c.user_id = auth.uid() OR c.assigned_agent_id = auth.uid()))
    )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = messages.conversation_id 
    AND (
      is_account_member(c.account_id, 'admin') OR 
      (is_account_member(c.account_id, 'agent') AND (c.user_id = auth.uid() OR c.assigned_agent_id = auth.uid()))
    )
  )
);
