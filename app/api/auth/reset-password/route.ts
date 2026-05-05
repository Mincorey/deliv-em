import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, emailTemplates } from '@/lib/services/email'
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimiter'
import { logger } from '@/lib/services/logger'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const allowed = await checkRateLimit(`password-reset:${ip}`)

    if (!allowed) {
      logger.warn('Rate limit exceeded for password reset', { ip })
      return NextResponse.json({ error: 'Слишком много попыток, попробуйте позже' }, { status: 429 })
    }

    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email не указан' }, { status: 400 })
    }

    // Генерируем токен восстановления (в реальности сохранить в БД)
    const resetToken = crypto.getRandomValues(new Uint8Array(32))
    const resetTokenHex = Array.from(resetToken)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetTokenHex}`

    const template = emailTemplates.passwordReset(resetUrl, name || 'Пользователь')
    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    if (!result.success) {
      logger.error('Failed to send password reset email', { email, error: result.error })
      return NextResponse.json({ error: 'Ошибка при отправке письма' }, { status: 500 })
    }

    logger.info('Password reset email sent', { email })
    return NextResponse.json({ success: true, message: 'Письмо с инструкциями отправлено' })
  } catch (error) {
    logger.error('Password reset endpoint error', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
