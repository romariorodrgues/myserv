import { signOut } from 'next-auth/react'

/**
 * Clears client-side storage and performs a safe sign-out redirecting to /entrar
 * Helps evitar que sessões antigas/local storage re-hidratem uma conta diferente.
 */
export async function fullSignOut() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.clear()
      sessionStorage.clear()

      // Remove potencial sobra de cookies do NextAuth (cenários com múltiplas contas)
      const cookieNames = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        'next-auth.callback-url',
        'next-auth.csrf-token',
      ]
      const expires = 'Thu, 01 Jan 1970 00:00:00 GMT'
      const hostname = window.location.hostname

      cookieNames.forEach((name) => {
        document.cookie = `${name}=; path=/; expires=${expires};`
        if (hostname && hostname.includes('.')) {
          document.cookie = `${name}=; path=/; domain=.${hostname}; expires=${expires};`
        }
      })
    } catch {
      // ignore storage errors
    }
  }

  await signOut({ callbackUrl: '/entrar', redirect: true })
}
