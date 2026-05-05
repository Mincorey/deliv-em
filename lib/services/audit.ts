import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AuditLogEntry {
  id: string
  table_name: string
  record_id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  user_id: string | null
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  changed_fields: string[] | null
  created_at: string
}

export interface AuditFilterOptions {
  tableName?: string
  recordId?: string
  userId?: string
  operation?: 'INSERT' | 'UPDATE' | 'DELETE'
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

/**
 * Get audit log entries with optional filtering
 */
export async function getAuditLog(filters?: AuditFilterOptions) {
  let query = supabase.from('audit_log').select('*')

  if (filters?.tableName) {
    query = query.eq('table_name', filters.tableName)
  }

  if (filters?.recordId) {
    query = query.eq('record_id', filters.recordId)
  }

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId)
  }

  if (filters?.operation) {
    query = query.eq('operation', filters.operation)
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString())
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString())
  }

  query = query.order('created_at', { ascending: false })

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching audit log:', error)
    return { data: [], error }
  }

  return { data: (data as AuditLogEntry[]) || [], error: null }
}

/**
 * Get audit history for a specific record
 */
export async function getRecordAuditTrail(tableName: string, recordId: string) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('table_name', tableName)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching audit trail:', error)
    return { data: [], error }
  }

  return { data: (data as AuditLogEntry[]) || [], error: null }
}

/**
 * Get all changes made by a specific user
 */
export async function getUserAuditActivity(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching user audit activity:', error)
    return { data: [], error }
  }

  return { data: (data as AuditLogEntry[]) || [], error: null }
}

/**
 * Get all changes for a specific table
 */
export async function getTableAuditLog(tableName: string, limit = 100) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('table_name', tableName)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching table audit log:', error)
    return { data: [], error }
  }

  return { data: (data as AuditLogEntry[]) || [], error: null }
}

/**
 * Get detailed change information for an audit entry
 * Shows exactly what changed from old to new values
 */
export function getChangeDetails(entry: AuditLogEntry): Array<{
  field: string
  oldValue: any
  newValue: any
  changed: boolean
}> {
  const changes: Array<{
    field: string
    oldValue: any
    newValue: any
    changed: boolean
  }> = []

  if (entry.operation === 'INSERT') {
    if (entry.new_values) {
      Object.entries(entry.new_values).forEach(([field, newValue]) => {
        changes.push({
          field,
          oldValue: null,
          newValue,
          changed: true,
        })
      })
    }
  } else if (entry.operation === 'DELETE') {
    if (entry.old_values) {
      Object.entries(entry.old_values).forEach(([field, oldValue]) => {
        changes.push({
          field,
          oldValue,
          newValue: null,
          changed: true,
        })
      })
    }
  } else if (entry.operation === 'UPDATE') {
    const changedFields = entry.changed_fields || []

    changedFields.forEach((field) => {
      changes.push({
        field,
        oldValue: entry.old_values?.[field],
        newValue: entry.new_values?.[field],
        changed: true,
      })
    })
  }

  return changes
}

/**
 * Generate a human-readable description of what changed
 */
export function describeChange(entry: AuditLogEntry): string {
  const operationMap: Record<string, string> = {
    INSERT: 'Создано',
    UPDATE: 'Обновлено',
    DELETE: 'Удалено',
  }

  const operation = operationMap[entry.operation] || entry.operation
  const timestamp = new Date(entry.created_at).toLocaleString('ru-RU')

  let description = `${operation} ${timestamp}`

  if (entry.user_id) {
    description += ` (пользователь: ${entry.user_id})`
  }

  if (entry.changed_fields && entry.changed_fields.length > 0) {
    description += `. Изменённые поля: ${entry.changed_fields.join(', ')}`
  }

  return description
}

/**
 * Get statistics about changes
 */
export async function getAuditStatistics(
  tableName?: string,
  startDate?: Date,
  endDate?: Date
) {
  let query = supabase.from('audit_log').select('operation')

  if (tableName) {
    query = query.eq('table_name', tableName)
  }

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString())
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching audit statistics:', error)
    return null
  }

  const stats = {
    total: data?.length || 0,
    inserts: data?.filter((d: any) => d.operation === 'INSERT').length || 0,
    updates: data?.filter((d: any) => d.operation === 'UPDATE').length || 0,
    deletes: data?.filter((d: any) => d.operation === 'DELETE').length || 0,
  }

  return stats
}
