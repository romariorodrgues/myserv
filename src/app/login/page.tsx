/**
 * Login redirect page - redirects to correct login page
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

import { redirect } from 'next/navigation'

export default function LoginRedirect() {
  // Redirect to the correct login page
  redirect('/entrar')
}
