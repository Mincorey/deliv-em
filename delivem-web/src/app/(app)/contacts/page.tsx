'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

const SUBJECTS = [
  'Вопрос о сервисе',
  'Сообщить об ошибке',
  'Предложение по улучшению',
  'Сотрудничество',
  'Другое',
]

export default function ContactsPage() {
  const toast = useToast()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.show('Заполните все обязательные поля', 'error')
      return
    }
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('feedback').insert({
      user_id: user?.id ?? null,
      name: name.trim(),
      email: email.trim(),
      subject,
      message: message.trim(),
    })

    setLoading(false)
    if (error) {
      toast.show('Ошибка отправки. Попробуйте ещё раз', 'error')
    } else {
      toast.show('Сообщение отправлено! Спасибо за обратную связь', 'success')
      setName('')
      setEmail('')
      setMessage('')
      setSubject(SUBJECTS[0])
    }
  }

  const contacts = [
    { icon: 'email', label: 'support@delivem.ru' },
    { icon: 'phone', label: '+7 (940) 000-00-00' },
    { icon: 'location_on', label: 'Сухум, Республика Абхазия' },
  ]

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-1">Обратная связь</h2>
      <p className="text-sm mb-6" style={{ color: '#757682' }}>
        Есть вопросы или предложения? Напишите разработчику
      </p>

      <div className="bg-white rounded-2xl p-6 mb-4">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Ваше имя *</label>
              <input
                className="input-field"
                placeholder="Алексей"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label-sm">Email *</label>
              <input
                className="input-field"
                type="email"
                placeholder="alex@mail.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label-sm">Тема</label>
            <select
              className="input-field"
              style={{ cursor: 'pointer' }}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-sm">Сообщение *</label>
            <textarea
              className="textarea-field"
              rows={5}
              placeholder="Опишите ваш вопрос или предложение подробнее..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '14px' }}
            onClick={handleSend}
            disabled={loading}
          >
            <span className="material-symbols-outlined text-base">send</span>
            {loading ? 'Отправляем...' : 'Отправить сообщение'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5">
        <h3 className="font-bold mb-3">Контакты</h3>
        <div className="flex flex-col gap-3">
          {contacts.map((c) => (
            <div key={c.icon} className="flex items-center gap-3">
              <span className="material-symbols-outlined text-base" style={{ color: '#006c49' }}>
                {c.icon}
              </span>
              <span className="text-sm">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
