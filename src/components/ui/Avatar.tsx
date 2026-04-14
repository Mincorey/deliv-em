import { getInitials } from '@/lib/utils'

interface AvatarProps {
  name: string
  avatarUrl?: string | null
  size?: number
}

export function Avatar({ name, avatarUrl, size = 40 }: AvatarProps) {
  const initials = getInitials(name)
  const fontSize = size * 0.36

  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize, flexShrink: 0 }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize }}>{initials}</span>
      )}
    </div>
  )
}
