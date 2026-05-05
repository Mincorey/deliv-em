import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Cached function: revalidates every 5 minutes
const getCachedCouriers = unstable_cache(
  async (from: number, to: number) => {
    const supabase = await createClient()
    const { data: couriers, error } = await supabase
      .from('profiles')
      .select('*, courier_profile:courier_profiles(*)')
      .eq('role', 'courier')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new Error(error.message)
    return couriers
  },
  ['couriers-list'],
  { revalidate: 300, tags: ['couriers'] } // Cache for 5 minutes
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const from = parseInt(searchParams.get('from') || '0')
    const to = parseInt(searchParams.get('to') || '14')

    const couriers = await getCachedCouriers(from, to)

    return NextResponse.json(couriers)
  } catch (error) {
    console.error('Error fetching couriers:', error)
    return NextResponse.json({ error: 'Failed to fetch couriers' }, { status: 500 })
  }
}
