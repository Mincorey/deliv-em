'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { StarRating } from '@/components/ui/StarRating'
import { submitRating } from '@/app/(app)/tasks/actions'
import { useToast } from '@/components/ui/Toast'

interface RatingModalProps {
  open: boolean
  onClose: () => void
  taskId: string
  toUserId: string
  toUserName: string
}

export function RatingModal({
  open,
  onClose,
  taskId,
  toUserId,
  toUserName,
}: RatingModalProps) {
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  async function handleSubmit() {
    setLoading(true)
    const res = await submitRating({ taskId, toUserId, score, comment })
    setLoading(false)
    if (res.error) {
      toast.show(res.error, 'error')
    } else {
      toast.show('Оценка отправлена!', 'success')
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="400px">
      <div className="p-6 text-center">
        <span
          className="material-symbols-outlined fill-icon"
          style={{ fontSize: '3rem', color: '#f59e0b' }}
        >
          star
        </span>
        <h3 className="text-xl font-bold mt-2 mb-1">Оцените исполнителя</h3>
        <p className="text-sm mb-5" style={{ color: '#757682' }}>
          Оцените {toUserName} — ваш отзыв помогает другим
        </p>
        <div className="flex justify-center mb-5">
          <StarRating value={score} onChange={setScore} />
        </div>
        <textarea
          className="textarea-field mb-4 text-left"
          rows={3}
          placeholder="Комментарий (необязательно)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose}>
            Пропустить
          </button>
          <button
            className="btn-primary flex-1"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
