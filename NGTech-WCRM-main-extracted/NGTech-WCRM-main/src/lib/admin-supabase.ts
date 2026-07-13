import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Singleton service-role Supabase client.
 *
 * This client bypasses RLS entirely — use it ONLY in server-side
 * code (API routes / server actions) that has already performed its
 * own authorization checks. Never expose it to the browser.
 */
let _adminClient: ReturnType<typeof createSupabaseClient> | null = null

export function getAdminClient() {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('[admin-supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }
    _adminClient = createSupabaseClient(url, key, {
      auth: { persistSession: false },
    })
  }
  return _adminClient
}
