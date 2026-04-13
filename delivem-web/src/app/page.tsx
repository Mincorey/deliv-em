import { redirect } from 'next/navigation'

// Middleware handles auth redirects; this is just a fallback
export default function RootPage() {
  redirect('/dashboard')
}
