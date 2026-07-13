import Link from 'next/link'

export default function AdminForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10">
          <svg className="h-10 w-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.955 11.955 0 01.99 11.987c0 5.292 3.536 9.747 8.574 10.963a11.96 11.96 0 002.087.198 11.96 11.96 0 002.087-.198C18.464 21.734 22 17.279 22 11.987c0-2.219-.605-4.3-1.662-6.086A11.959 11.959 0 0112 2.964m0 6.072V12m0 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have platform admin access.<br />
          Contact the system administrator.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-hover"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
