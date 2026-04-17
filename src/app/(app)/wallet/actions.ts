'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/** Service-role client — bypasses RLS, server-only */
function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export interface TopUpResult {
  error?  : string
  balance?: number
}

export async function topUpWallet(amount: number): Promise<TopUpResult> {
  if (!amount || amount < 10) return { error: 'Минимальная сумма пополнения — 10 ₽' }

  // Verify the caller is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = adminClient()

  // Fetch current balance
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('wallet_balance')
    .eq('id', user.id)
    .single()

  if (profileErr || !profile) return { error: 'Профиль не найден' }

  const newBalance = Number(profile.wallet_balance) + amount

  // Update balance
  const { error: updateErr } = await admin
    .from('profiles')
    .update({ wallet_balance: newBalance })
    .eq('id', user.id)

  if (updateErr) return { error: 'Ошибка обновления баланса' }

  // Insert transaction (service role bypasses the missing INSERT RLS policy)
  await admin.from('transactions').insert({
    user_id     : user.id,
    type        : 'top_up',
    amount,
    balance_after: newBalance,
    description : `Пополнение кошелька на ${amount} ₽`,
  })

  // Insert wallet notification
  await admin.from('notifications').insert({
    user_id : user.id,
    type    : 'wallet',
    title   : 'Кошелёк пополнен',
    body    : `Баланс пополнен на ${amount} ₽ · Текущий баланс: ${Math.round(newBalance)} ₽`,
  })

  return { balance: newBalance }
}
