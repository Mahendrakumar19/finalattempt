/**
 * Masks a phone number for privacy/compliance purposes.
 * Leaves the country code (if any) and the last 3-4 digits visible.
 * Example: +91 9876543210 -> +91 98*****210
 */
export function maskPhone(phone: string | null | undefined, isAgent: boolean, isMaskingEnabled: boolean): string {
  if (!phone) return ''
  
  // Only mask if the user is an agent and masking is enabled for the account
  if (!isAgent || !isMaskingEnabled) return phone
  
  // Basic masking logic for common formats (e.g. +919876543210 or 9876543210)
  // Let's reveal first 4 characters (like +919) and last 3 characters
  if (phone.length <= 6) return phone // Too short to mask meaningfully
  
  const start = phone.substring(0, 4)
  const end = phone.substring(phone.length - 3)
  const maskedLength = phone.length - start.length - end.length
  
  return `${start}${'*'.repeat(Math.max(0, maskedLength))}${end}`
}
