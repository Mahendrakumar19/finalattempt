/**
 * Plan definitions and limit enforcement helpers.
 *
 * All limit values must match the defaults set in 037_saas_platform.sql.
 * The DB is the source of truth at runtime (accounts.max_contacts etc.),
 * but these constants power the UI badges and the create-client form defaults.
 */

export type Plan = 'free' | 'starter' | 'pro' | 'enterprise'
export type AccountStatus = 'active' | 'suspended' | 'cancelled'

export interface PlanMeta {
  label: string
  description: string
  maxContacts: number    // -1 = unlimited
  maxMessagesPm: number  // per month, -1 = unlimited
  badge: string          // colour class for the badge pill
}

export const PLANS: Record<Plan, PlanMeta> = {
  free: {
    label: 'Free',
    description: 'Try the platform with basic limits.',
    maxContacts: 500,
    maxMessagesPm: 1_000,
    badge: 'bg-muted text-muted-foreground',
  },
  starter: {
    label: 'Starter',
    description: 'For small teams getting started.',
    maxContacts: 2_000,
    maxMessagesPm: 5_000,
    badge: 'bg-blue-500/15 text-blue-400',
  },
  pro: {
    label: 'Pro',
    description: 'For growing businesses.',
    maxContacts: 10_000,
    maxMessagesPm: 30_000,
    badge: 'bg-violet-500/15 text-violet-400',
  },
  enterprise: {
    label: 'Enterprise',
    description: 'Unlimited — custom invoicing.',
    maxContacts: -1,
    maxMessagesPm: -1,
    badge: 'bg-amber-500/15 text-amber-400',
  },
}

export const STATUS_META: Record<AccountStatus, { label: string; badge: string }> = {
  active: {
    label: 'Active',
    badge: 'bg-emerald-500/15 text-emerald-400',
  },
  suspended: {
    label: 'Suspended',
    badge: 'bg-orange-500/15 text-orange-400',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-destructive/15 text-destructive',
  },
}

/**
 * Format a limit number for display — shows "Unlimited" for -1.
 */
export function formatLimit(n: number): string {
  if (n === -1) return 'Unlimited'
  return n.toLocaleString()
}

/**
 * Usage percentage (0–100). Returns 0 if limit is -1 (unlimited).
 */
export function usagePct(used: number, limit: number): number {
  if (limit === -1) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

/**
 * Check if an account has exceeded its contact limit.
 * Returns { ok: true } if within limits, or { ok: false, message } if exceeded.
 */
export function checkContactLimit(
  currentCount: number,
  maxContacts: number,
): { ok: boolean; message?: string } {
  if (maxContacts === -1) return { ok: true }
  if (currentCount >= maxContacts) {
    return {
      ok: false,
      message: `Contact limit reached (${currentCount.toLocaleString()} / ${maxContacts.toLocaleString()}). Upgrade your plan to add more contacts.`,
    }
  }
  return { ok: true }
}

/**
 * Check if an account has exceeded its monthly message limit.
 * Returns { ok: true } if within limits, or { ok: false, message } if exceeded.
 */
export function checkMessageLimit(
  sentThisMonth: number,
  maxMessagesPm: number,
): { ok: boolean; message?: string } {
  if (maxMessagesPm === -1) return { ok: true }
  if (sentThisMonth >= maxMessagesPm) {
    return {
      ok: false,
      message: `Monthly message limit reached (${sentThisMonth.toLocaleString()} / ${maxMessagesPm.toLocaleString()}). Upgrade your plan or wait until next month.`,
    }
  }
  return { ok: true }
}

/**
 * Get the current month's start date as a DATE string (YYYY-MM-01).
 */
export function currentMonthStart(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
