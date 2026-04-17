'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { sendToTelegram } from './actions'

const SUBJECTS = [
  'Вопрос о сервисе',
  'Сообщить об ошибке',
  'Предложение по улучшению',
  'Сотрудничество',
  'Другое',
]

function SubjectSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input-field"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}
      >
        <span>{value}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          expand_more
        </span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--surface)', border: '1.5px solid var(--border)',
          borderRadius: '1rem', boxShadow: 'var(--shadow-md)', zIndex: 50,
          overflow: 'hidden', animation: 'fadeInUp 0.18s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          {SUBJECTS.map((s, i) => (
            <button key={s} type="button" onClick={() => { onChange(s); setOpen(false) }} style={{
              display: 'block', width: '100%', padding: '10px 20px', textAlign: 'left',
              background: value === s ? 'var(--brand-soft)' : 'transparent',
              color: value === s ? 'var(--brand-text)' : 'var(--text-1)',
              fontWeight: value === s ? 700 : 400, fontSize: '0.9rem',
              cursor: 'pointer', border: 'none',
              borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              transition: 'background 0.15s',
            }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ContactsPage() {
  const toast = useToast()
  const supabase = createClient()

  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.show('Заполните все обязательные поля', 'error'); return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('feedback').insert({
      user_id: user?.id ?? null, name: name.trim(),
      email: email.trim(), subject, message: message.trim(),
    })
    if (!error) {
      await sendToTelegram({ name: name.trim(), email: email.trim(), subject, message: message.trim() })
    }
    setLoading(false)
    if (error) {
      toast.show('Ошибка отправки. Попробуйте ещё раз', 'error')
    } else {
      toast.show('Сообщение отправлено! Спасибо за обратную связь', 'success')
      setName(''); setEmail(''); setMessage(''); setSubject(SUBJECTS[0])
    }
  }

  const card = {
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    borderRadius: '1rem',
  }

  const contacts = [
    { icon: 'email',       label: 'mincorey@internet.ru' },
    { icon: 'location_on', label: "Deliv'em | Республика Абхазия, г. Сухум | All Rights Reserved" },
  ]

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>Обратная связь</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>
        Есть вопросы или предложения? Напишите разработчику
      </p>

      <div className="p-6 mb-4" style={card}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="label-sm">Ваше имя *</label>
            <input className="input-field" placeholder="Алексей" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label-sm">Email *</label>
            <input className="input-field" type="email" placeholder="alex@mail.ru" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="label-sm">Тема</label>
            <SubjectSelect value={subject} onChange={setSubject} />
          </div>

          <div>
            <label className="label-sm">Сообщение *</label>
            <textarea
              className="textarea-field" rows={5}
              placeholder="Опишите ваш вопрос или предложение подробнее..."
              value={message} onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button className="btn-primary" style={{ justifyContent: 'center', padding: '14px' }} onClick={handleSend} disabled={loading}>
            <span className="material-symbols-outlined text-base">send</span>
            {loading ? 'Отправляем...' : 'Отправить сообщение'}
          </button>
        </div>
      </div>

      <div className="p-5" style={card}>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-1)' }}>Контакты</h3>
        <div className="flex flex-col gap-3">
          {contacts.map((c) => (
            <div key={c.icon} className="flex items-center gap-3">
              <span className="material-symbols-outlined text-base" style={{ color: 'var(--green)' }}>{c.icon}</span>
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
