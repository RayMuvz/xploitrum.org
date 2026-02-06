/**
 * Shared auth token helper for API requests.
 * Use this so all protected requests send the token from context or storage (sessionStorage then localStorage).
 */

const AUTH_TOKENS_KEY = 'auth_tokens'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const fromSession = sessionStorage.getItem(AUTH_TOKENS_KEY)
    const fromLocal = localStorage.getItem(AUTH_TOKENS_KEY)
    const raw = fromSession || fromLocal
    if (!raw) return null
    const parsed = JSON.parse(raw) as { access_token?: string }
    return parsed?.access_token ?? null
  } catch {
    return null
  }
}

/** Headers object to attach to fetch/axios for authenticated requests. */
export function getAuthHeaders(token: string | null | undefined): Record<string, string> {
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}
