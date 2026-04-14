'use client'

import { useTransition } from 'react'
import { toggleFavoriteCourier } from './actions'

interface FavoriteButtonProps {
  courierId: string
  isFav: boolean
}

export function FavoriteButton({ courierId, isFav }: FavoriteButtonProps) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => toggleFavoriteCourier(courierId, isFav))}
      disabled={pending}
      className="p-2 rounded-full transition-colors"
      style={{
        color: isFav ? '#ba1a1a' : '#c5c5d3',
        background: 'transparent',
        border: 'none',
        cursor: pending ? 'wait' : 'pointer',
      }}
      title={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
    >
      <span className={`material-symbols-outlined ${isFav ? 'fill-icon' : ''}`}>
        favorite
      </span>
    </button>
  )
}
