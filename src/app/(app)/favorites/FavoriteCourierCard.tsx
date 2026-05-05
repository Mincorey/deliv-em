'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import type { Profile, CourierProfile, TransportType } from '@/lib/types'

interface FavoriteCourierCardProps {
  person: Profile
  cp: CourierProfile | null
  transport: { icon: string; label: string } | null
  role: 'courier' | 'customer'
}

export function FavoriteCourierCard({
  person,
  cp,
  transport,
  role,
}: FavoriteCourierCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()
  const supabase = createClient()

  async function handleRemove() {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('favorite_couriers')
        .delete()
        .eq('courier_id', person.id)

      if (error) {
        toast.show('Ошибка при удалении', 'error')
      } else {
        toast.show('Удалено из избранного', 'success')
        // Reload the page to update the list
        window.location.reload()
      }
    } catch (err) {
      toast.show('Ошибка', 'error')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (role !== 'courier') {
    return (
      <div className="courier-card">
        <Avatar name={person.full_name} avatarUrl={person.avatar_url} size={48} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{person.full_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="material-symbols-outlined" style={{ color: 'var(--text-3)', fontSize: 14 }}>location_on</span>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>{person.city}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="courier-card" style={{ position: 'relative' }}>
        <Link
          href={`/profile/${person.id}`}
          style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, textDecoration: 'none', width: '100%' }}
        >
          <Avatar name={person.full_name} avatarUrl={person.avatar_url} size={48} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{person.full_name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="material-symbols-outlined" style={{ color: 'var(--text-3)', fontSize: 14 }}>location_on</span>
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>{person.city}</span>
              {transport && (
                <>
                  <span style={{ color: 'var(--text-4)' }}>·</span>
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>{transport.label}</span>
                </>
              )}
            </div>
            {cp && (
              <div className="flex items-center gap-1 mt-1">
                <span className="font-bold text-xs" style={{ color: '#f59e0b' }}>{cp.rating?.toFixed(1)}</span>
                <span className="material-symbols-outlined fill-icon" style={{ color: '#f59e0b', fontSize: 12 }}>star</span>
                <span className="text-xs" style={{ color: 'var(--text-4)' }}>· {cp.completed_tasks} заданий</span>
              </div>
            )}
          </div>
        </Link>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="favorite-remove-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '9999px',
            background: 'transparent',
            border: '1.5px solid var(--border)',
            color: '#ba1a1a',
            cursor: 'pointer',
            transition: 'background 0.18s, border-color 0.18s',
            flexShrink: 0,
            marginTop: '0.5rem',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(186, 26, 26, 0.08)'
            e.currentTarget.style.borderColor = '#ba1a1a'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
        </button>
      </div>

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div style={{ padding: '2rem 1.5rem' }}>
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-1)' }}>
            Удалить из избранного?
          </h3>
          <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Курьер {person.full_name} будет удалён из избранного списка.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn-ghost"
              style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
            >
              Отмена
            </button>
            <button
              onClick={handleRemove}
              disabled={deleting}
              className="btn-green"
              style={{ flex: 1, justifyContent: 'center', padding: '12px', background: '#ba1a1a', opacity: deleting ? 0.6 : 1 }}
            >
              {deleting ? (
                <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 0.9s linear infinite' }}>
                  progress_activity
                </span>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  Удалить
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
