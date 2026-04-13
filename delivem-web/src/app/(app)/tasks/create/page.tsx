'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTask } from '../actions'
import { useToast } from '@/components/ui/Toast'
import { TASK_TYPE_META } from '@/lib/types'
import type { TaskType } from '@/lib/types'

const TASK_TYPES = Object.entries(TASK_TYPE_META) as [
  TaskType,
  (typeof TASK_TYPE_META)[TaskType]
][]

export default function CreateTaskPage() {
  const router = useRouter()
  const toast = useToast()

  const [taskType, setTaskType] = useState<TaskType>('documents')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [fromAddress, setFromAddress] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!title.trim()) {
      toast.show('Введите название поручения', 'error')
      return
    }
    if (!fromAddress.trim() || !toAddress.trim()) {
      toast.show('Укажите адреса откуда и куда', 'error')
      return
    }
    if (!reward || Number(reward) <= 0) {
      toast.show('Укажите вознаграждение курьеру', 'error')
      return
    }

    setLoading(true)
    const res = await createTask({
      title: title.trim(),
      description: description.trim(),
      task_type: taskType,
      reward: Number(reward),
      from_address: fromAddress.trim(),
      to_address: toAddress.trim(),
      deadline: deadline || null,
      is_private: false,
      invited_couriers: [],
    })
    setLoading(false)

    if (res.error) {
      toast.show(res.error, 'error')
    } else {
      toast.show('Поручение опубликовано!', 'success')
      router.push(`/tasks/${res.taskId}`)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-1">Новое поручение</h2>
      <p className="text-sm mb-6" style={{ color: '#757682' }}>
        Заполните данные — курьеры увидят ваше задание
      </p>

      <div className="flex flex-col gap-5">
        {/* Task type */}
        <div className="bg-white rounded-2xl p-5">
          <label className="label-sm">Тип поручения</label>
          <div
            className="grid gap-3 mt-2"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}
          >
            {TASK_TYPES.map(([type, meta]) => (
              <button
                key={type}
                onClick={() => setTaskType(type)}
                className={`type-btn ${taskType === type ? 'selected' : ''}`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: meta.color, fontSize: '1.6rem' }}
                >
                  {meta.icon}
                </span>
                <span className="text-xs font-bold">{meta.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main fields */}
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
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
              type="number"
              placeholder="Сколько заработает курьер"
              min="0"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
            />
          </div>
        </div>

        {/* Addresses */}
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <label className="label-sm" style={{ color: '#00236f' }}>
              📍 Откуда забрать
            </label>
            <input
              className="input-field"
              placeholder="Адрес, ориентир или место в Абхазии"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px" style={{ background: '#e6e8ea' }} />
            <span className="material-symbols-outlined text-sm" style={{ color: '#006c49' }}>
              arrow_downward
            </span>
            <div className="flex-1 h-px" style={{ background: '#e6e8ea' }} />
          </div>
          <div>
            <label className="label-sm" style={{ color: '#006c49' }}>
              🏁 Куда доставить
            </label>
            <input
              className="input-field"
              placeholder="Адрес получателя"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
            />
          </div>

          {/* Map placeholder */}
          <div
            style={{
              height: 180,
              borderRadius: '1rem',
              background: '#eceef0',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div className="text-center">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '2.5rem', color: '#757682' }}
              >
                map
              </span>
              <p className="text-xs mt-1 font-semibold" style={{ color: '#757682' }}>
                Яндекс Карты
                <br />
                <span style={{ fontWeight: 400, opacity: 0.7 }}>
                  Подключатся при деплое
                </span>
              </p>
            </div>
            <div className="absolute top-3 right-3">
              <div
                className="glass rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1"
                style={{ color: '#757682' }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 9999,
                    background: '#006c49',
                    display: 'inline-block',
                  }}
                />
                GPS активен
              </div>
            </div>
          </div>
        </div>

        {/* Deadline + description */}
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <label className="label-sm">Срок выполнения</label>
            <input
              className="input-field"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
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

        {/* Fee notice + submit */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#00236f,#1e3a8a)' }}
        >
          <div
            className="absolute"
            style={{
              opacity: 0.1,
              color: '#fff',
              right: -20,
              bottom: -20,
              fontSize: '6rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '6rem' }}>
              account_balance_wallet
            </span>
          </div>
          <div className="relative z-10">
            <p
              className="text-white text-xs font-bold tracking-widest uppercase"
              style={{ opacity: 0.7 }}
            >
              Стоимость размещения
            </p>
            <div className="flex items-end gap-2 my-2">
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff' }}>100</span>
              <span className="text-white font-bold text-lg mb-1">₽</span>
              <span className="text-white text-xs mb-1.5 ml-1" style={{ opacity: 0.6 }}>
                спишется с кошелька
              </span>
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
