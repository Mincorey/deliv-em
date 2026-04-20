'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import type { Profile } from '@/lib/types'

interface NavItem {
  href: string
  icon: string
  label: string
}

const NAV_CUSTOMER: NavItem[] = [
  { href: '/dashboard',    icon: 'dashboard',             label: 'Обзор' },
  { href: '/tasks',        icon: 'rocket_launch',         label: 'Активные' },
  { href: '/orders',       icon: 'history',               label: 'Архив' },
  { href: '/tasks/create', icon: 'add_circle',            label: 'Создать поручение' },
  { href: '/couriers',     icon: 'directions_bike',       label: 'Курьеры' },
  { href: '/favorites',    icon: 'favorite',              label: 'Избранные' },
  { href: '/messages',     icon: 'chat_bubble',           label: 'Сообщения' },
  { href: '/wallet',       icon: 'account_balance_wallet',label: 'Кошелёк' },
  { href: '/ratings',      icon: 'leaderboard',           label: 'Рейтинги' },
  { href: '/about',        icon: 'info',                  label: 'О сервисе' },
  { href: '/contacts',     icon: 'support_agent',         label: 'Контакты' },
]

const NAV_COURIER: NavItem[] = [
  { href: '/dashboard', icon: 'dashboard',    label: 'Обзор' },
  { href: '/tasks',     icon: 'search',       label: 'Поиск заданий' },
  { href: '/active',    icon: 'rocket_launch', label: 'Активные' },
  { href: '/orders',    icon: 'history',      label: 'Архив' },
  { href: '/favorites', icon: 'favorite',     label: 'Избранные заказчики' },
  { href: '/messages',  icon: 'chat_bubble',  label: 'Сообщения' },
  { href: '/ratings',   icon: 'leaderboard',  label: 'Рейтинги' },
  { href: '/about',     icon: 'info',         label: 'О сервисе' },
  { href: '/contacts',  icon: 'support_agent',label: 'Контакты' },
]

interface SidebarProps {
  profile: Profile
  unreadMessages?: number
}

export function Sidebar({ profile, unreadMessages = 0 }: SidebarProps) {
  const pathname = usePathname()
  const nav = profile.role === 'customer' ? NAV_CUSTOMER : NAV_COURIER

  return (
    <aside
      className="sidebar-auto flex flex-col h-full flex-shrink-0 py-4 transition-all duration-300"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1.5px solid var(--border)',
        transition: 'background 0.25s',
      }}
    >
      {/* Logo */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg,#00236f,#006c49)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined text-white" style={{ fontSize: 18 }}>
              local_shipping
            </span>
          </div>
          <div className="nav-label-hidden" style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--brand-text)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              Deliv&apos;em
            </div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
              {profile.role === 'customer' ? 'Заказчик' : 'Курьер'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 flex flex-col gap-1 overflow-y-auto">
        {nav.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, flexShrink: 0 }}>
                {item.icon}
              </span>
              <span className="nav-label-hidden" style={{ whiteSpace: 'nowrap' }}>
                {item.label}
                {item.icon === 'chat_bubble' && unreadMessages > 0 && (
                  <span
                    className="ml-2 inline-flex items-center justify-center text-white rounded-full"
                    style={{ background: 'var(--green)', width: 16, height: 16, fontSize: '0.55rem', fontWeight: 800 }}
                  >
                    {unreadMessages}
                  </span>
                )}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Profile footer */}
      <div className="px-3 pt-3" style={{ borderTop: '1.5px solid var(--border)' }}>
        <Link href="/profile" className="nav-link">
          <Avatar name={profile.full_name} avatarUrl={profile.avatar_url} />
          <div className="nav-label-hidden" style={{ overflow: 'hidden' }}>
            <div className="text-sm font-bold" style={{ color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile.full_name}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-3)' }}>
              {profile.city}
            </div>
          </div>
        </Link>
      </div>
    </aside>
  )
}
