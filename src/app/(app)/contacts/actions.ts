'use server'

export async function sendToTelegram(data: {
  name: string
  email: string
  subject: string
  message: string
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.warn('Telegram env vars not set: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID')
    return
  }

  const text =
    `<b>Новое сообщение с сайта Deliv'em</b>\n\n` +
    `<b>От:</b> ${escapeHtml(data.name)}\n` +
    `<b>Email:</b> ${escapeHtml(data.email)}\n\n` +
    `<b>Тема:</b> ${escapeHtml(data.subject)}\n\n` +
    `<b>Сообщение:</b>\n${escapeHtml(data.message)}`

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('Telegram API error:', body)
  }
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
