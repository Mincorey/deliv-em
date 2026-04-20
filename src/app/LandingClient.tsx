'use client'

import { useState, useRef, useCallback } from 'react'
import { LandingHeader } from './_landing/LandingHeader'
import { LandingHero } from './_landing/LandingHero'
import { LandingSteps } from './_landing/LandingSteps'
import { LandingFeatures } from './_landing/LandingFeatures'
import { LandingStats } from './_landing/LandingStats'
import { LandingAuth } from './_landing/LandingAuth'
import { LandingFooter } from './_landing/LandingFooter'

interface LandingProps {
  stats: { customers: number; couriers: number; completedTasks: number; cities: number }
}

export function LandingClient({ stats }: LandingProps) {
  const authRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<'login' | 'register'>('login')

  const scrollToAuth = useCallback((defaultTab?: 'login' | 'register') => {
    if (defaultTab) setTab(defaultTab)
    authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-1)', overflowX: 'hidden' }}>
      <LandingHeader scrollToAuth={scrollToAuth} />
      <LandingHero scrollToAuth={scrollToAuth} />
      <LandingSteps />
      <LandingFeatures />
      <LandingStats stats={stats} />
      <LandingAuth ref={authRef} activeTab={tab} onTabChange={setTab} />
      <LandingFooter />
    </div>
  )
}
