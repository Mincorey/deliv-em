import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// AnyPay webhook handler
// Docs: https://anypay.io/doc/api
export async function POST(request: NextRequest) {
  const body = await request.text()
  const params = new URLSearchParams(body)

  const shopId = params.get('merchant_id')
  const orderId = params.get('pay_id')
  const amount = params.get('amount')
  const status = params.get('status')
  const sign = params.get('sign')

  // Verify signature: MD5(secret:amount:orderId)
  const expected = crypto
    .createHash('md5')
    .update(`${process.env.ANYPAY_SECRET}:${amount}:${orderId}`)
    .digest('hex')

  if (sign !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (status !== 'paid') {
    return NextResponse.json({ ok: true })
  }

  // Find pending transaction by anypay_order_id
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tx } = await supabase
    .from('transactions')
    .select('*')
    .eq('anypay_order_id', orderId)
    .single()

  if (!tx) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  // Update user balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('wallet_balance')
    .eq('id', tx.user_id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const newBalance = profile.wallet_balance + tx.amount
  await supabase
    .from('profiles')
    .update({ wallet_balance: newBalance })
    .eq('id', tx.user_id)

  await supabase
    .from('transactions')
    .update({ balance_after: newBalance })
    .eq('id', tx.id)

  // Notify user
  await supabase.from('notifications').insert({
    user_id: tx.user_id,
    type: 'wallet_topup',
    title: `Кошелёк пополнен на ${tx.amount} ₽`,
    body: 'Средства зачислены на ваш баланс',
  })

  return NextResponse.json({ ok: true })
}
