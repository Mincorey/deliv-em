import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Cached function: revalidates every 10 minutes
const getCachedRatings = unstable_cache(
  async (courierIds: string[]) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('ratings')
      .select('to_user_id, score')
      .in('to_user_id', courierIds)

    if (error) throw new Error(error.message)
    return data || []
  },
  ['ratings-batch'],
  { revalidate: 600, tags: ['ratings'] } // Cache for 10 minutes
)

export async function POST(request: NextRequest) {
  try {
    const { courierIds } = await request.json()

    if (!Array.isArray(courierIds) || courierIds.length === 0) {
      return NextResponse.json([], { status: 200 })
    }

    const ratings = await getCachedRatings(courierIds)
    return NextResponse.json(ratings)
  } catch (error) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 })
  }
}
