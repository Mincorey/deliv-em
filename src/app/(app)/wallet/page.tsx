'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { topUpWallet } from './actions'
import { AnimatedPage, AnimatedItem } from '@/components/ui/Animated'
import type { Transaction, Profile } from '@/lib/types'

const QUICK_AMOUNTS = [200, 500, 1000]

const TX_ICONS : Record<string, string>  = { top_up: 'add_circle', task_fee: 'arrow_upward', payout: 'payments', refund: 'undo' }
const TX_LABELS: Record<string, string>  = { top_up: 'Пополнение', task_fee: 'Комиссия', payout: 'Выплата', refund: 'Возврат' }
const TX_COLORS: Record<string, string>  = { top_up: 'var(--green)', task_fee: '#ba1a1a', payout: 'var(--green)', refund: 'var(--brand)' }

export default function WalletPage() {
  const router  = useRouter()
  const toast   = useToast()
  const supabase = createClient()

  const [profile,      setProfile]      = useState<Profile | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [amount,       setAmount]       = useState('')
  const [loading,      setLoading]      = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const [{ data: prof }, { data: txs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ])
      setProfile(prof as Profile)
      setTransactions((txs ?? []) as Transaction[])
    }
    load()
  }, [])

  async function handleTopUp() {
    const amt = Number(amount)
    if (!amt || amt < 10) { toast.show('Минимальная сумма пополнения — 10 ₽', 'error'); return }
    setLoading(true)

    const res = await topUpWallet(amt)

    if (res.error) {
      toast.show(res.error, 'error')
    } else {
      // Update balance in local profile state
      setProfile((p) => p ? { ...p, wallet_balance: res.balance! } : p)

      // Re-fetch last 10 transactions from DB (server action already inserted it)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
        setTransactions((txs ?? []) as Transaction[])
      }

      setAmount('')
      toast.show(`Баланс пополнен на ${amt} ₽`, 'success')
    }
    setLoading(false)
  }

  const card: React.CSSProperties = {
    background  : 'var(--surface)',
    border      : '1.5px solid var(--border)',
    boxShadow   : 'var(--shadow-sm)',
    borderRadius: '1rem',
  }

  return (
    <AnimatedPage className="p-6 max-w-2xl mx-auto">
      <AnimatedItem>
        <h2 className="text-xl font-bold mb-5 page-header" style={{ color: 'var(--text-1)' }}>Кошелёк</h2>
      </AnimatedItem>

      {/* Balance card */}
      <AnimatedItem className="rounded-2xl p-7 mb-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#00236f 0%,#006c49 100%)' }}>
        <div className="absolute" style={{ opacity: 0.1, right: -30, top: -30, color: '#fff' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '9rem' }}>account_balance_wallet</span>
        </div>
        <p className="text-white text-xs font-bold tracking-widest uppercase" style={{ opacity: 0.7 }}>Текущий баланс</p>
        <div className="flex items-end gap-2 mt-2">
          <span style={{ fontSize: '3rem', fontWeight: 900, color: '#fff' }}>{Math.round(profile?.wallet_balance ?? 0)}</span>
          <span className="text-white font-bold text-xl mb-1">₽</span>
        </div>
        <p className="text-white text-xs mt-1" style={{ opacity: 0.6 }}>Deliv&apos;em · Внутренний кошелёк</p>
      </AnimatedItem>

      {/* Top-up */}
      <AnimatedItem className="p-5 mb-4" style={card}>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-1)' }}>Пополнить через AnyPay</h3>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => setAmount(String(a))}
              className={`type-btn text-sm font-bold ${amount === String(a) ? 'selected' : ''}`}
            >
              {a} ₽
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            className="input-field flex-1"
            type="number"
            placeholder="Сумма в рублях"
            min="10"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            className="btn-primary"
            style={{ padding: '14px 20px', flexShrink: 0 }}
            onClick={handleTopUp}
            disabled={loading}
          >
            {loading ? '...' : 'Пополнить'}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-4)' }}>Оплата через AnyPay · Безопасно</p>
      </AnimatedItem>

      {/* History */}
      <AnimatedItem className="p-5" style={card}>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-1)' }}>История операций</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-3)' }}>Операций пока нет</p>
        ) : (
          <div className="flex flex-col gap-1">
            {transactions.map((tx) => {
              const isIncome = tx.amount > 0
              const color    = TX_COLORS[tx.type] ?? (isIncome ? 'var(--green)' : '#ba1a1a')
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: 36, height: 36, background: isIncome ? 'var(--green-soft)' : 'rgba(186,26,26,0.10)' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color }}>
                      {TX_ICONS[tx.type] ?? 'receipt'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                      {tx.description ?? TX_LABELS[tx.type]}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {new Date(tx.created_at).toLocaleDateString('ru', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm" style={{ color }}>
                      {isIncome ? '+' : ''}{tx.amount} ₽
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{Math.round(tx.balance_after)} ₽</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </AnimatedItem>
    </AnimatedPage>
  )
}
