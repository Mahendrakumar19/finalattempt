-- 047_agent_suspension.sql

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

-- RPC to let an admin suspend a member
CREATE OR REPLACE FUNCTION suspend_account_member(p_user_id UUID, p_is_suspended BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role account_role_enum;
  v_target_account UUID;
BEGIN
  -- 1. Get caller's role and target's account
  SELECT account_role INTO v_caller_role
  FROM profiles WHERE user_id = auth.uid();

  SELECT account_id INTO v_target_account
  FROM profiles WHERE user_id = p_user_id;

  -- 2. Caller must be admin or owner
  IF v_caller_role NOT IN ('admin', 'owner') THEN
    RAISE EXCEPTION USING errcode = '42501', message = 'Must be an admin to suspend members';
  END IF;

  -- 3. Target must be in the same account (or we check account match)
  -- For safety, ensure the caller is in the same account
  IF v_target_account IS NULL OR v_target_account != (SELECT account_id FROM profiles WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION USING errcode = '42501', message = 'Member not found in your account';
  END IF;

  -- 4. Cannot suspend the owner
  IF (SELECT account_role FROM profiles WHERE user_id = p_user_id) = 'owner' THEN
    RAISE EXCEPTION USING errcode = '22023', message = 'Cannot suspend the account owner';
  END IF;

  -- 5. Cannot suspend yourself
  IF auth.uid() = p_user_id THEN
    RAISE EXCEPTION USING errcode = '22023', message = 'Cannot suspend yourself';
  END IF;

  UPDATE profiles SET is_suspended = p_is_suspended WHERE user_id = p_user_id;
END;
$$;
