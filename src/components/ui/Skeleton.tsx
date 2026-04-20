import { CSSProperties } from 'react'

interface SkeletonProps {
  className?: string
  style?: CSSProperties
  circle?: boolean
}

export function Skeleton({ className = '', style, circle }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${circle ? 'rounded-full' : ''} ${className}`}
      style={style}
    />
  )
}
