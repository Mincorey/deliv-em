import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Cached function: revalidates every 10 minutes
const getCachedCompletedTasks = unstable_cache(
  async (courierIds: string[]) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tasks')
      .select('courier_id')
      .in('courier_id', courierIds)
      .eq('status', 'completed')

    if (error) throw new Error(error.message)
    return data || []
  },
  ['completed-tasks-batch'],
  { revalidate: 600, tags: ['tasks'] } // Cache for 10 minutes
)

export async function POST(request: NextRequest) {
  try {
    const { courierIds } = await request.json()

    if (!Array.isArray(courierIds) || courierIds.length === 0) {
      return NextResponse.json([], { status: 200 })
    }

    const tasks = await getCachedCompletedTasks(courierIds)
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching completed tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch completed tasks' }, { status: 500 })
  }
}
