-- ============================================================
-- 052_trial_on_signup.sql
-- Automatically starts a 7-day trial for new signups and backfills
-- existing free accounts to start their 7-day trial now.
-- ============================================================

-- Update handle_new_user to set trial_ends_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_account_id UUID;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  INSERT INTO public.accounts (name, owner_user_id, trial_ends_at)
  VALUES (
    COALESCE(NULLIF(v_full_name, ''), NEW.email, 'My account'), 
    NEW.id,
    NOW() + INTERVAL '7 days'
  )
  RETURNING id INTO v_account_id;

  INSERT INTO public.profiles (user_id, full_name, email, account_id, account_role)
  VALUES (NEW.id, v_full_name, NEW.email, v_account_id, 'owner');

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to bootstrap account/profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Backfill existing accounts that are on free plan and don't have a trial end date
UPDATE public.accounts
SET trial_ends_at = NOW() + INTERVAL '7 days'
WHERE plan = 'free' AND trial_ends_at IS NULL;
