import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const from = parseInt(request.nextUrl.searchParams.get('from') ?? '0')
  const to = parseInt(request.nextUrl.searchParams.get('to') ?? '14')

  const { data: couriers, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      avatar_url,
      city,
      bio,
      role,
      courier_profile:courier_profiles(transport_type)
    `)
    .eq('role', 'courier')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(couriers)
}
