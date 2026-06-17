import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { courierIds } = await request.json()

  if (!Array.isArray(courierIds) || courierIds.length === 0) {
    return NextResponse.json([])
  }

  const { data: ratings, error } = await supabase
    .from('ratings')
    .select('to_user_id, score')
    .in('to_user_id', courierIds)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(ratings)
}
