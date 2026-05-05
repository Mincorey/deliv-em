import { NextRequest, NextResponse } from 'next/server'
import {
  softDelete,
  restoreDeleted,
  getDeletionStats,
  getDeletedRecords,
  isDeleted,
} from '@/lib/services/softDelete'
import { logger } from '@/lib/services/logger'
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimiter'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const allowed = await checkRateLimit(`soft-delete:${ip}`)

    if (!allowed) {
      logger.warn('Rate limit exceeded for soft-delete', { ip })
      return NextResponse.json({ error: 'Слишком много запросов' }, { status: 429 })
    }

    const { action, tableName, recordId } = await request.json()

    if (!action || !tableName || !recordId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, tableName, recordId' },
        { status: 400 }
      )
    }

    // Validate table name
    const validTables = ['profiles', 'tasks', 'ratings', 'messages', 'feedback']
    if (!validTables.includes(tableName)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
    }

    let result

    switch (action) {
      case 'delete':
        result = await softDelete(tableName, recordId)
        if (result.success) {
          logger.info('Record soft-deleted', { tableName, recordId })
        }
        break

      case 'restore':
        result = await restoreDeleted(tableName, recordId)
        if (result.success) {
          logger.info('Record restored', { tableName, recordId })
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!result.success) {
      logger.error('Soft-delete operation failed', { tableName, recordId, error: result.error })
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, action })
  } catch (error) {
    logger.error('Soft-delete endpoint error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const tableName = searchParams.get('table')

    if (!action || !tableName) {
      return NextResponse.json(
        { error: 'Missing required parameters: action, table' },
        { status: 400 }
      )
    }

    const validTables = ['profiles', 'tasks', 'ratings', 'messages', 'feedback']
    if (!validTables.includes(tableName)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
    }

    let result

    switch (action) {
      case 'stats':
        result = await getDeletionStats(tableName)
        break

      case 'deleted-records':
        const limit = parseInt(searchParams.get('limit') || '50')
        result = await getDeletedRecords(tableName, limit)
        break

      case 'check':
        const recordId = searchParams.get('record_id')
        if (!recordId) {
          return NextResponse.json({ error: 'Missing record_id parameter' }, { status: 400 })
        }
        const deleted = await isDeleted(tableName, recordId)
        return NextResponse.json({ recordId, deleted, tableName })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if ('error' in result && result.error) {
      logger.error('Soft-delete query failed', { tableName, action, error: result.error })
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    logger.error('Soft-delete GET endpoint error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
