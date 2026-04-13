'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import type { Transaction, Profile } from '@/lib/types'

const QUICK_AMOUNTS = [200, 500, 1000]

export default function WalletPage() {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const [{ data: prof }, { data: txs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ])

      setProfile(prof as Profile)
      setTransactions((txs ?? []) as Transaction[])
    }
    load()
  }, [])

  async function handleTopUp() {
    const amt = Number(amount)
    if (!amt || amt < 10) {
      toast.show('Минимальная сумма пополнения — 10 ₽', 'error')
      return
    }
    setLoading(true)
    // In production: create AnyPay payment and redirect to payment page
    // For demo: direct balance top-up
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const newBalance = (profile?.wallet_balance ?? 0) + amt
    await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', user.id)

    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'top_up',
      amount: amt,
      balance_after: newBalance,
      description: 'Пополнение через AnyPay',
    })

    setProfile((p) => p ? { ...p, wallet_balance: newBalance } : p)
    setTransactions((prev) => [
      {
        id: Date.now().toString(),
        user_id: user.id,
        task_id: null,
        type: 'top_up',
        amount: amt,
        balance_after: newBalance,
        description: 'Пополнение через AnyPay',
        anypay_order_id: null,
        created_at: new Date().toISOString(),
      } as Transaction,
      ...prev,
    ])
    setAmount('')
    setLoading(false)
    toast.show(`Баланс пополнен на ${amt} ₽`, 'success')
  }

  const txIcons: Record<string, string> = {
    top_up: 'add_circle',
    task_fee: 'arrow_upward',
    payout: 'payments',
    refund: 'undo',
  }
  const txColors: Record<string, string> = {
    top_up: '#006c49',
    task_fee: '#ba1a1a',
    payout: '#006c49',
    refund: '#757682',
  }
  const txLabels: Record<string, string> = {
    top_up: 'Пополнение',
    task_fee: 'Комиссия',
    payout: 'Выплата',
    refund: 'Возврат',
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-5">Кошелёк</h2>

      {/* Balance card */}
      <div
        className="rounded-2xl p-7 mb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#00236f 0%,#006c49 100%)' }}
      >
        <div
          className="absolute"
          style={{ opacity: 0.1, right: -30, top: -30, fontSize: '9rem', color: '#fff' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '9rem' }}>
            account_balance_wallet
          </span>
        </div>
        <p className="text-white text-xs font-bold tracking-widest uppercase" style={{ opacity: 0.7 }}>
          Текущий баланс
        </p>
        <div className="flex items-end gap-2 mt-2">
          <span style={{ fontSize: '3rem', fontWeight: 900, color: '#fff' }}>
            {Math.round(profile?.wallet_balance ?? 0)}
          </span>
          <span className="text-white font-bold text-xl mb-1">₽</span>
        </div>
        <p className="text-white text-xs mt-1" style={{ opacity: 0.6 }}>
          Deliv&apos;em · Внутренний кошелёк
        </p>
      </div>

      {/* Top up */}
      <div className="bg-white rounded-2xl p-5 mb-4">
        <h3 className="font-bold mb-3">Пополнить через AnyPay</h3>
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
        <p className="text-xs mt-2" style={{ color: '#c5c5d3' }}>
          Оплата через AnyPay · Безопасно
        </p>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-2xl p-5">
        <h3 className="font-bold mb-3">История операций</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#c5c5d3' }}>
            Операций пока нет
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 py-2"
                style={{ borderBottom: '1px solid #f2f4f6' }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 36,
                    height: 36,
                    background: tx.amount > 0 ? '#6cf8bb33' : '#ffdad6',
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ color: txColors[tx.type] ?? '#757682' }}
                  >
                    {txIcons[tx.type] ?? 'receipt'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {tx.description ?? txLabels[tx.type]}
                  </p>
                  <p className="text-xs" style={{ color: '#c5c5d3' }}>
                    {new Date(tx.created_at).toLocaleDateString('ru')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className="font-bold text-sm"
                    style={{ color: tx.amount > 0 ? '#006c49' : '#ba1a1a' }}
                  >
                    {tx.amount > 0 ? '+' : ''}{tx.amount} ₽
                  </p>
                  <p className="text-xs" style={{ color: '#c5c5d3' }}>
                    {tx.balance_after} ₽
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
