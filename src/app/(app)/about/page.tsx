'use client'

import Link from 'next/link'
import { AnimatedPage, AnimatedItem } from '@/components/ui/Animated'

export default function AboutPage() {
  const steps = [
    {
      n: 1,
      title: 'Заказчик создаёт поручение',
      desc: 'Описывает задачу, маршрут, срок и вознаграждение курьеру',
      accent: 'var(--brand)',
    },
    {
      n: 2,
      title: 'Курьер принимает задание',
      desc: 'Видит задания в ленте и выбирает подходящее',
      accent: 'var(--green)',
    },
    {
      n: 3,
      title: 'Выполнение и оценка',
      desc: 'Задание выполнено — оба участника оставляют оценки',
      accent: 'var(--text-2)',
    },
  ]

  const cardStyle = {
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    borderRadius: '1rem',
    padding: '1.5rem',
    marginBottom: '1rem',
  }

  return (
    <AnimatedPage className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <AnimatedItem className="rounded-2xl p-8 mb-6 text-center" style={{ background: 'linear-gradient(135deg,#00236f,#006c49)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <span className="material-symbols-outlined text-white" style={{ fontSize: '2rem' }}>local_shipping</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Deliv&apos;em</h1>
        <p className="text-white text-sm mt-1" style={{ opacity: 0.7 }}>Сервис микропоручений · Абхазия</p>
      </AnimatedItem>

      <AnimatedItem style={cardStyle}>
        <h3 className="font-bold text-lg mb-3" style={{ color: 'var(--text-1)' }}>О сервисе</h3>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-2)' }}>
          Deliv&apos;em — первая P2P-платформа микропоручений в Республике Абхазия. Мы соединяем заказчиков и исполнителей, чтобы любая задача была выполнена быстро и надёжно.
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-2)' }}>
          Доставка документов, покупка продуктов, транспортировка материалов, передача подарков — всё это можно делегировать проверенным местным курьерам.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
          Сервис работает во всех городах Абхазии: Сухум, Гагра, Гудаута, Новый Афон, Очамчыра и других.
        </p>
      </AnimatedItem>

      <AnimatedItem style={cardStyle}>
        <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-1)' }}>Как это работает</h3>
        <div className="flex flex-col gap-4">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div style={{
                width: 36, height: 36, borderRadius: 9999, flexShrink: 0,
                background: 'var(--brand-soft)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 800, color: s.accent, fontSize: '0.9rem',
                border: '1.5px solid var(--border)',
              }}>
                {s.n}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{s.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </AnimatedItem>

      <AnimatedItem style={cardStyle}>
        <h3 className="font-bold text-lg mb-3" style={{ color: 'var(--text-1)' }}>Информация</h3>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Версия', value: '1.0.0 Beta' },
            { label: 'Год запуска', value: '2026' },
            { label: 'Страна', value: 'Республика Абхазия, г. Сухум' },
          ].map((row) => (
            <div key={row.label} className="flex justify-between text-sm" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-3)' }}>{row.label}</span>
              <span className="font-bold" style={{ color: 'var(--text-1)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </AnimatedItem>

      <AnimatedItem style={{ ...cardStyle, marginBottom: 0 }}>
        <h3 className="font-bold text-lg mb-3" style={{ color: 'var(--text-1)' }}>Правовые документы</h3>
        <div className="flex flex-col gap-3">
          {[
            { href: '/privacy', icon: 'shield', label: 'Политика конфиденциальности', desc: 'Как мы собираем и защищаем ваши данные', color: 'var(--brand)' },
            { href: '/terms',   icon: 'gavel',  label: 'Условия использования',        desc: 'Правила работы с сервисом',            color: 'var(--green)' },
          ].map((doc) => (
            <Link key={doc.href} href={doc.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px', borderRadius: '0.85rem',
                border: '1.5px solid var(--border)', background: 'var(--surface-alt)',
                transition: 'background 0.18s, border-color 0.18s, transform 0.18s cubic-bezier(.22,1,.36,1), box-shadow 0.18s',
                cursor: 'pointer',
              }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.background = 'var(--surface)'
                  el.style.borderColor = doc.color
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = 'var(--shadow-sm)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.background = 'var(--surface-alt)'
                  el.style.borderColor = 'var(--border)'
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: `${doc.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-outlined fill-icon" style={{ fontSize: 20, color: doc.color }}>{doc.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)' }}>{doc.label}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>{doc.desc}</p>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-4)', flexShrink: 0 }}>chevron_right</span>
              </div>
            </Link>
          ))}
        </div>
      </AnimatedItem>
    </AnimatedPage>
  )
}
