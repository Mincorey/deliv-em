'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { StarRating } from '@/components/ui/StarRating'
import { submitRating } from '@/app/(app)/tasks/actions'
import { useToast } from '@/components/ui/Toast'
import type { Profile } from '@/lib/types'

interface RatingBlockProps {
  taskId:        string
  target:        Profile
  roleLabel:     string   // 'Курьер' | 'Заказчик'
  existingScore: number | null   // null = ещё не оценивал
}

export function RatingBlock({ taskId, target, roleLabel, existingScore }: RatingBlockProps) {
  const toast = useToast()
  const [score,     setScore]     = useState(existingScore ?? 5)
  const [comment,   setComment]   = useState('')
  const [submitted, setSubmitted] = useState(existingScore !== null)
  const [loading,   setLoading]   = useState(false)

  async function handleSubmit() {
    if (score < 1 || score > 5) return
    setLoading(true)
    const res = await submitRating({ taskId, toUserId: target.id, score, comment })
    setLoading(false)
    if (res.error) {
      toast.show(res.error, 'error')
    } else {
      setSubmitted(true)
      toast.show('Оценка отправлена!', 'success')
    }
  }

  const starColor = '#f59e0b'

  return (
    <div style={{
      background: 'var(--surface)', border: '1.5px solid var(--border)',
      borderRadius: '1rem', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: submitted
          ? 'linear-gradient(135deg, rgba(45,212,160,0.08), rgba(45,212,160,0.03))'
          : 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))',
        borderBottom: '1px solid var(--border)',
        padding: '0.875rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span className="material-symbols-outlined fill-icon" style={{
          fontSize: 20,
          color: submitted ? 'var(--green)' : starColor,
        }}>
          {submitted ? 'check_circle' : 'star'}
        </span>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-1)' }}>
          {submitted ? 'Вы оценили' : `Оцените ${roleLabel.toLowerCase()}а`}
        </p>
      </div>

      <div style={{ padding: '1rem 1.25rem' }}>
        {/* Target person */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={target.full_name} avatarUrl={target.avatar_url} size={40} />
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)' }}>{target.full_name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{roleLabel} · {target.city}</p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-3 mb-3">
          <StarRating value={score} onChange={submitted ? undefined : setScore} readonly={submitted} size={1.75} />
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: starColor }}>{score}/5</span>
        </div>

        {/* Submitted state */}
        {submitted ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', fontStyle: 'italic' }}>
            {comment || 'Без комментария'}
          </p>
        ) : (
          <>
            <textarea
              className="textarea-field mb-3"
              rows={2}
              placeholder="Комментарий (необязательно, до 200 символов)"
              maxLength={200}
              value={comment}
              onChange={e => setComment(e.target.value)}
              style={{ fontSize: '0.875rem' }}
            />
            <div className="flex gap-2">
              <button
                className="btn-ghost text-sm flex-1"
                style={{ justifyContent: 'center', padding: '10px' }}
                onClick={() => setSubmitted(true)}
              >
                Пропустить
              </button>
              <button
                className="btn-primary flex-1"
                style={{ justifyContent: 'center', padding: '10px', fontSize: '0.875rem' }}
                onClick={handleSubmit}
                disabled={loading}
              >
                <span className="material-symbols-outlined fill-icon" style={{ fontSize: 16 }}>star</span>
                {loading ? 'Отправка...' : 'Отправить оценку'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
