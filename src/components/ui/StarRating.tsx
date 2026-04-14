'use client'

import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: number
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 1.4,
}: StarRatingProps) {
  const [hover, setHover] = useState(0)

  return (
    <div className="star-rating flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={n <= (hover || value) ? 'on' : ''}
          style={{ fontSize: `${size}rem`, cursor: readonly ? 'default' : 'pointer' }}
          onClick={() => !readonly && onChange?.(n)}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
        >
          ★
        </span>
      ))}
    </div>
  )
}
