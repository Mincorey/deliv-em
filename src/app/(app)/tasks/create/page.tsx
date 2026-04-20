'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createTask } from '../actions'
import { useToast } from '@/components/ui/Toast'
import { AddressMapPicker } from '@/components/ui/AddressMapPicker'
import { TASK_TYPE_META } from '@/lib/types'
import type { TaskType } from '@/lib/types'
import DateTimePicker from '@/components/ui/DateTimePicker'

const TASK_TYPES = Object.entries(TASK_TYPE_META) as [TaskType, (typeof TASK_TYPE_META)[TaskType]][]

const CITIES = ['Гагра', 'Пицунда', 'Гудаута', 'Новый Афон', 'Сухум', 'Агудзера', 'Очамчыра', 'Ткуарчал', 'Гал']

function CityDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onMD(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMD)
    return () => document.removeEventListener('mousedown', onMD)
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input-field"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left', width: '100%', gap: 8 }}
      >
        <span style={{ fontSize: '0.9rem' }}>{value}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-3)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          expand_more
        </span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '1rem', boxShadow: 'var(--shadow-md)', zIndex: 100, overflow: 'hidden', animation: 'fadeInUp 0.18s cubic-bezier(0.22,1,0.36,1) both' }}>
          {CITIES.map((c, i) => (
            <button
              key={c}
              type="button"
              onClick={() => { onChange(c); setOpen(false) }}
              style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', background: value === c ? 'var(--brand-soft)' : 'transparent', color: value === c ? 'var(--brand-text)' : 'var(--text-1)', fontWeight: value === c ? 700 : 400, fontSize: '0.875rem', cursor: 'pointer', border: 'none', borderTop: i > 0 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
            >{c}</button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CreateTaskPage() {
  const router = useRouter()
  const toast  = useToast()

  const [taskType,     setTaskType]     = useState<TaskType>('documents')
  const [title,        setTitle]        = useState('')
  const [description,  setDescription]  = useState('')
  const [reward,       setReward]       = useState('')
  const [city,         setCity]         = useState('Сухум')
  const [fromAddress,  setFromAddress]  = useState('')
  const [toAddress,    setToAddress]    = useState('')
  const [deadline,     setDeadline]     = useState('')
  const [loading,      setLoading]      = useState(false)

  async function handleSubmit() {
    if (!title.trim())                          { toast.show('Введите название поручения', 'error');    return }
    if (!fromAddress.trim() || !toAddress.trim()) { toast.show('Укажите адреса откуда и куда', 'error'); return }
    if (!reward || Number(reward) <= 0)         { toast.show('Укажите вознаграждение курьеру', 'error'); return }
    setLoading(true)
    const res = await createTask({
      title: title.trim(), description: description.trim(), task_type: taskType,
      reward: Number(reward), city, from_address: fromAddress.trim(), to_address: toAddress.trim(),
      deadline: deadline || null, is_private: false, invited_couriers: [],
    })
    setLoading(false)
    if (res.error) { toast.show(res.error, 'error') } else {
      toast.show('Поручение опубликовано!', 'success')
      router.push(`/tasks/${res.taskId}`)
    }
  }

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    borderRadius: '1rem',
    padding: '1.25rem',
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-1 page-header" style={{ color: 'var(--text-1)' }}>Новое поручение</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>Заполните данные — курьеры увидят ваше задание</p>

      <div className="flex flex-col gap-5">

        {/* Task type */}
        <div style={card}>
          <label className="label-sm">Тип поручения</label>
          <div className="grid gap-3 mt-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
            {TASK_TYPES.map(([type, meta]) => (
              <button key={type} onClick={() => setTaskType(type)} className={`type-btn ${taskType === type ? 'selected' : ''}`}>
                <span className="material-symbols-outlined type-btn-icon" style={{ fontSize: '1.6rem', color: meta.color }}>{meta.icon}</span>
                <span className="text-xs font-bold">{meta.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title + reward */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label-sm">Название поручения</label>
            <input
              className="input-field"
              placeholder="Например: передать документы в офис"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label-sm">Вознаграждение курьеру (₽)</label>
            <input
              className="input-field"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Сколько заработает курьер"
              value={reward}
              onChange={(e) => setReward(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>
          <div>
            <label className="label-sm">Город</label>
            <CityDropdown value={city} onChange={setCity} />
          </div>
        </div>

        {/* ── Map with address pickers ── */}
        <AddressMapPicker
          fromAddress={fromAddress}
          toAddress={toAddress}
          onFromChange={setFromAddress}
          onToChange={setToAddress}
        />

        {/* Deadline + description */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label-sm">Срок выполнения</label>
            <DateTimePicker value={deadline} onChange={setDeadline} />
          </div>
          <div>
            <label className="label-sm">Описание и особые пожелания</label>
            <textarea
              className="textarea-field"
              rows={4}
              placeholder="Особые инструкции для курьера..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Fee + submit */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#00236f,#1e3a8a)' }}>
          <div className="absolute" style={{ opacity: 0.1, color: '#fff', right: -20, bottom: -20 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '6rem' }}>account_balance_wallet</span>
          </div>
          <div className="relative z-10">
            <p className="text-white text-xs font-bold tracking-widest uppercase" style={{ opacity: 0.7 }}>Стоимость размещения</p>
            <div className="flex items-end gap-2 my-2">
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff' }}>100</span>
              <span className="text-white font-bold text-lg mb-1">₽</span>
              <span className="text-white text-xs mb-1.5 ml-1" style={{ opacity: 0.6 }}>спишется с кошелька</span>
            </div>
            <button
              className="btn-green font-black px-8 py-3"
              style={{ fontSize: '0.95rem' }}
              onClick={handleSubmit}
              disabled={loading}
            >
              <span className="material-symbols-outlined text-base">send</span>
              {loading ? 'Публикуем...' : 'Опубликовать поручение'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
