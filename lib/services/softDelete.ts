import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type SoftDeleteTable = 'profiles' | 'tasks' | 'ratings' | 'messages' | 'feedback'

export interface DeletedRecord {
  id: string
  table_name: string
  deleted_at: string
}

/**
 * Soft delete a record (mark as deleted without removing from DB)
 * The deletion is automatically logged in audit_log table
 */
export async function softDelete(tableName: SoftDeleteTable, recordId: string) {
  try {
    const { error } = await supabase
      .from(tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', recordId)
      .is('deleted_at', null) // Only update if not already deleted

    if (error) {
      console.error(`Error soft-deleting from ${tableName}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Soft delete error:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Restore a soft-deleted record
 */
export async function restoreDeleted(tableName: SoftDeleteTable, recordId: string) {
  try {
    const { error } = await supabase
      .from(tableName)
      .update({ deleted_at: null })
      .eq('id', recordId)
      .not('deleted_at', 'is', null) // Only update if already deleted

    if (error) {
      console.error(`Error restoring from ${tableName}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Restore error:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Permanently delete a soft-deleted record (irreversible)
 * Should only be called for actual permanent deletion
 */
export async function permanentlyDelete(tableName: SoftDeleteTable, recordId: string) {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', recordId)
      .not('deleted_at', 'is', null) // Only delete if already soft-deleted

    if (error) {
      console.error(`Error permanently deleting from ${tableName}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Permanent delete error:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Check if a record is deleted
 */
export async function isDeleted(tableName: SoftDeleteTable, recordId: string): Promise<boolean> {
  try {
    // Temporarily disable RLS to check if record exists with deleted_at
    const { data, error } = await supabase
      .from(tableName)
      .select('deleted_at')
      .eq('id', recordId)
      .single()

    if (error) {
      console.error('Error checking deletion status:', error)
      return false
    }

    return data?.deleted_at !== null && data?.deleted_at !== undefined
  } catch (error) {
    console.error('Error in isDeleted:', error)
    return false
  }
}

/**
 * Get list of deleted records in a table
 */
export async function getDeletedRecords(tableName: SoftDeleteTable, limit = 100) {
  try {
    // Use RLS bypass with service role to see deleted records
    const { data, error } = await supabase
      .from(tableName)
      .select('id, deleted_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error(`Error fetching deleted records from ${tableName}:`, error)
      return { data: [], error: error.message }
    }

    return { data: (data as Array<{ id: string; deleted_at: string }>) || [], error: null }
  } catch (error) {
    console.error('Error in getDeletedRecords:', error)
    return { data: [], error: String(error) }
  }
}

/**
 * Get deletion history for a record
 * Shows when it was deleted and by looking at audit log
 */
export async function getDeletionHistory(tableName: SoftDeleteTable, recordId: string) {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .eq('operation', 'UPDATE')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching deletion history:', error)
      return { data: [], error: error.message }
    }

    // Filter only updates that changed deleted_at field
    const deletionChanges = (data || []).filter(
      (log: any) => log.changed_fields?.includes('deleted_at')
    )

    return { data: deletionChanges, error: null }
  } catch (error) {
    console.error('Error in getDeletionHistory:', error)
    return { data: [], error: String(error) }
  }
}

/**
 * Get deletion statistics for a table
 */
export async function getDeletionStats(tableName: SoftDeleteTable) {
  try {
    const { count: totalCount } = await supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true })

    const { count: activeCount } = await supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)

    const deletedCount = (totalCount || 0) - (activeCount || 0)

    return {
      table: tableName,
      total: totalCount || 0,
      active: activeCount || 0,
      deleted: deletedCount,
      deletionPercentage: totalCount ? ((deletedCount / totalCount) * 100).toFixed(2) : '0',
    }
  } catch (error) {
    console.error('Error getting deletion stats:', error)
    return { error: String(error) }
  }
}

/**
 * Bulk soft delete records
 */
export async function bulkSoftDelete(tableName: SoftDeleteTable, recordIds: string[]) {
  try {
    const { error } = await supabase
      .from(tableName)
      .update({ deleted_at: new Date().toISOString() })
      .in('id', recordIds)
      .is('deleted_at', null)

    if (error) {
      console.error(`Error bulk soft-deleting from ${tableName}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true, deleted: recordIds.length }
  } catch (error) {
    console.error('Bulk soft delete error:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Bulk restore soft-deleted records
 */
export async function bulkRestore(tableName: SoftDeleteTable, recordIds: string[]) {
  try {
    const { error } = await supabase
      .from(tableName)
      .update({ deleted_at: null })
      .in('id', recordIds)
      .not('deleted_at', 'is', null)

    if (error) {
      console.error(`Error bulk restoring from ${tableName}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true, restored: recordIds.length }
  } catch (error) {
    console.error('Bulk restore error:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Query active records (bypasses soft-deleted)
 * Useful when you want to explicitly query only active records
 */
export async function getActiveRecords(tableName: SoftDeleteTable, query?: Record<string, any>) {
  try {
    let request = supabase.from(tableName).select('*').is('deleted_at', null)

    // Apply additional filters if provided
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          request = request.eq(key, value)
        }
      })
    }

    const { data, error } = await request

    if (error) {
      console.error(`Error fetching active records from ${tableName}:`, error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error in getActiveRecords:', error)
    return { data: [], error: String(error) }
  }
}

/**
 * Cleanup: Permanently delete soft-deleted records older than X days
 * Use for GDPR compliance and data cleanup
 */
export async function cleanupOldDeletedRecords(
  tableName: SoftDeleteTable,
  daysOld: number = 90
): Promise<{ success: boolean; deleted: number; error?: string }> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // First, get count of records to be deleted
    const { count } = await supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true })
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffDate.toISOString())

    // Then delete them
    const { error } = await supabase
      .from(tableName)
      .delete()
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffDate.toISOString())

    if (error) {
      console.error(`Error cleaning up old deleted records from ${tableName}:`, error)
      return { success: false, deleted: 0, error: error.message }
    }

    return { success: true, deleted: count || 0 }
  } catch (error) {
    console.error('Cleanup error:', error)
    return { success: false, deleted: 0, error: String(error) }
  }
}
