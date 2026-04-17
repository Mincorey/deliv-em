'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateTask } from '../../actions'
import { useToast } from '@/components/ui/Toast'
import { AddressMapPicker } from '@/components/ui/AddressMapPicker'
import { TASK_TYPE_META } from '@/lib/types'
import type { TaskType } from '@/lib/types'
import DateTimePicker from '@/components/ui/DateTimePicker'

const TASK_TYPES = Object.entries(TASK_TYPE_META) as [TaskType, (typeof TASK_TYPE_META)[TaskType]][]

export default function EditTaskPage() {
  const params  = useParams()
  const router  = useRouter()
  const toast   = useToast()
  const supabase = createClient()

  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [taskType,     setTaskType]     = useState<TaskType>('documents')
  const [title,        setTitle]        = useState('')
  const [description,  setDescription]  = useState('')
  const [reward,       setReward]       = useState('')
  const [fromAddress,  setFromAddress]  = useState('')
  const [toAddress,    setToAddress]    = useState('')
  const [deadline,     setDeadline]     = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', params.id as string)
        .single()

      if (!task) { router.push('/tasks'); return }
      if (task.customer_id !== user.id || task.status !== 'published') {
        router.push(`/tasks/${params.id}`)
        return
      }

      setTaskType(task.task_type as TaskType)
      setTitle(task.title ?? '')
      setDescription(task.description ?? '')
      setReward(String(task.reward ?? ''))
      setFromAddress(task.from_address ?? '')
      setToAddress(task.to_address ?? '')
      setDeadline(task.deadline ?? '')
      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleSave() {
    if (!title.trim())                              { toast.show('Введите название поручения', 'error');    return }
    if (!fromAddress.trim() || !toAddress.trim())   { toast.show('Укажите адреса откуда и куда', 'error'); return }
    if (!reward || Number(reward) <= 0)             { toast.show('Укажите вознаграждение курьеру', 'error'); return }

    setSaving(true)
    const res = await updateTask(params.id as string, {
      title:        title.trim(),
      description:  description.trim(),
      task_type:    taskType,
      reward:       Number(reward),
      from_address: fromAddress.trim(),
      to_address:   toAddress.trim(),
      deadline:     deadline || null,
    })
    setSaving(false)

    if (res.error) {
      toast.show(res.error, 'error')
    } else {
      toast.show('Поручение обновлено!', 'success')
      router.push(`/tasks/${params.id}`)
    }
  }

  const card: React.CSSProperties = {
    background:   'var(--surface)',
    border:       '1.5px solid var(--border)',
    boxShadow:    'var(--shadow-sm)',
    borderRadius: '1rem',
    padding:      '1.25rem',
  }

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto flex justify-center py-20">
      <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--text-4)' }}>
        progress_activity
      </span>
    </div>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-1 page-header">
        <Link href={`/tasks/${params.id}`} style={{ color: 'var(--text-3)' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="text-xl font-bold flex-1" style={{ color: 'var(--text-1)' }}>Редактировать поручение</h2>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--text-3)', paddingLeft: '2.25rem' }}>
        Изменения сохранятся без дополнительной оплаты
      </p>

      <div className="flex flex-col gap-5">

        {/* Task type */}
        <div style={card}>
          <label className="label-sm">Тип поручения</label>
          <div className="grid gap-3 mt-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
            {TASK_TYPES.map(([type, meta]) => (
              <button key={type} onClick={() => setTaskType(type)} className={`type-btn ${taskType === type ? 'selected' : ''}`}>
                <span className="material-symbols-outlined type-btn-icon" style={{ fontSize: '1.6rem' }}>{meta.icon}</span>
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
        </div>

        {/* Map with address pickers */}
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

        {/* Save button */}
        <div className="flex gap-3">
          <Link href={`/tasks/${params.id}`} style={{ flex: 1 }}>
            <button className="btn-ghost w-full" style={{ justifyContent: 'center', padding: '14px' }}>
              Отмена
            </button>
          </Link>
          <button
            className="btn-green"
            style={{ flex: 2, justifyContent: 'center', padding: '14px', fontSize: '0.95rem', fontWeight: 800 }}
            onClick={handleSave}
            disabled={saving}
          >
            <span className="material-symbols-outlined text-base">save</span>
            {saving ? 'Сохраняем...' : 'Сохранить изменения'}
          </button>
        </div>

      </div>
    </div>
  )
}
