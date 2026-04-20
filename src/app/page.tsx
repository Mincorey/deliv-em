import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingClient } from './LandingClient'

export const dynamic = 'force-dynamic'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const [
    { count: customers },
    { count: couriers },
    { count: completedTasks },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'courier'),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
  ])

  return (
    <LandingClient
      stats={{
        customers: customers ?? 0,
        couriers: couriers ?? 0,
        completedTasks: completedTasks ?? 0,
        cities: 6,
      }}
    />
  )
}
