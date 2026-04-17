'use server'

import { createClient } from '@/lib/supabase/server'

export async function loginAction(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Email не подтверждён. Проверьте почту и перейдите по ссылке из письма.' }
    }
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Неверный email или пароль' }
    }
    return { error: error.message }
  }
  return {}
}

export async function registerAction(input: {
  email: string
  password: string
  fullName: string
  phone: string
  city: string
  role: 'customer' | 'courier'
  transportType?: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        phone: input.phone,
        city: input.city,
        role: input.role,
        transport_type: input.transportType,
      },
    },
  })

  if (error) return { error: error.message }
  if (!data.user) return { error: 'Не удалось создать аккаунт' }

  const { error: profErr } = await supabase.from('profiles').insert({
    id: data.user.id,
    role: input.role,
    full_name: input.fullName,
    phone: input.phone,
    email: input.email,
    city: input.city,
  })

  if (profErr) return { error: 'Аккаунт создан, но профиль не сохранился: ' + profErr.message }

  if (input.role === 'courier') {
    await supabase.from('courier_profiles').insert({
      id: data.user.id,
      transport_type: input.transportType ?? 'foot',
    })
  }

  return {}
}
