import { NextRequest, NextResponse } from 'next/server'
import {
  getAuditLog,
  getTableAuditLog,
  getRecordAuditTrail,
  getUserAuditActivity,
  getAuditStatistics,
} from '@/lib/services/audit'
import { logger } from '@/lib/services/logger'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'all'
    const tableName = searchParams.get('table')
    const recordId = searchParams.get('record_id')
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    logger.info('Audit log requested', { type, tableName, recordId, userId })

    let result

    switch (type) {
      case 'record':
        if (!tableName || !recordId) {
          return NextResponse.json(
            { error: 'table and record_id parameters required' },
            { status: 400 }
          )
        }
        result = await getRecordAuditTrail(tableName, recordId)
        break

      case 'user':
        if (!userId) {
          return NextResponse.json({ error: 'user_id parameter required' }, { status: 400 })
        }
        result = await getUserAuditActivity(userId, limit)
        break

      case 'table':
        if (!tableName) {
          return NextResponse.json({ error: 'table parameter required' }, { status: 400 })
        }
        result = await getTableAuditLog(tableName, limit)
        break

      case 'stats':
        const stats = await getAuditStatistics(
          tableName || undefined,
          searchParams.get('start_date') ? new Date(searchParams.get('start_date')!) : undefined,
          searchParams.get('end_date') ? new Date(searchParams.get('end_date')!) : undefined
        )
        return NextResponse.json({ stats })

      default:
        result = await getAuditLog({
          tableName: tableName || undefined,
          limit,
        })
    }

    if (result.error) {
      logger.error('Audit log query error', result.error)
      return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
    }

    return NextResponse.json({ data: result.data })
  } catch (error) {
    logger.error('Audit endpoint error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
