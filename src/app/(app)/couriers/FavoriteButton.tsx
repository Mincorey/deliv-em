'use client'

import { useTransition } from 'react'
import { toggleFavoriteCourier } from './actions'
import { useToast } from '@/components/ui/Toast'

interface FavoriteButtonProps {
  courierId: string
  isFav: boolean
}

export function FavoriteButton({ courierId, isFav }: FavoriteButtonProps) {
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  const handleClick = () => {
    startTransition(async () => {
      const result = await toggleFavoriteCourier(courierId, isFav)
      if (result.error) {
        toast.show(result.error, 'error')
      } else {
        toast.show(
          isFav ? 'Удалено из избранного' : 'Добавлено в избранное',
          'success'
        )
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="p-2 rounded-full transition-colors"
      style={{
        color: isFav ? '#ba1a1a' : '#c5c5d3',
        background: 'transparent',
        border: 'none',
        cursor: pending ? 'wait' : 'pointer',
        opacity: pending ? 0.6 : 1,
      }}
      title={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
    >
      <span className={`material-symbols-outlined ${isFav ? 'fill-icon' : ''}`} style={{
        animation: pending ? 'spin 0.9s linear infinite' : 'none',
      }}>
        favorite
      </span>
    </button>
  )
}
