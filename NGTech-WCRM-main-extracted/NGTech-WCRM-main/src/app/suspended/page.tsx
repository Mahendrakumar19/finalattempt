import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function SuspendedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500/10">
          <svg className="h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Account Suspended</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account has been temporarily suspended.<br />
          Please contact support for more information.
        </p>
        
        {user && (
          <form action="/api/auth/signout" method="POST" className="mt-8">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-muted px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted-foreground/20"
            >
              Sign Out
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
