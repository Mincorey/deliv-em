import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, emailTemplates } from '@/lib/services/email'
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimiter'
import { logger } from '@/lib/services/logger'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const allowed = await checkRateLimit(`feedback:${ip}`)

    if (!allowed) {
      logger.warn('Rate limit exceeded for feedback', { ip })
      return NextResponse.json({ error: 'Слишком много запросов, попробуйте позже' }, { status: 429 })
    }

    const { name, email, message } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }

    const template = emailTemplates.feedback(name, email, message)
    const result = await sendEmail({
      to: process.env.EMAIL_FROM!,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    if (!result.success) {
      logger.error('Failed to send feedback email', { email, error: result.error })
      return NextResponse.json({ error: 'Ошибка при отправке сообщения' }, { status: 500 })
    }

    logger.info('Feedback sent successfully', { from: email })
    return NextResponse.json({ success: true, message: 'Сообщение отправлено' })
  } catch (error) {
    logger.error('Feedback endpoint error', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
