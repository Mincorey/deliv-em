import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

const emailProvider = process.env.EMAIL_PROVIDER || 'mailgun'

async function createTransporter() {
  switch (emailProvider) {
    case 'mailgun':
      return nodemailer.createTransport({
        host: 'smtp.mailgun.org',
        port: 465,
        secure: true,
        auth: {
          user: `postmaster@${process.env.MAILGUN_DOMAIN}`,
          pass: process.env.MAILGUN_API_KEY,
        },
      })

    case 'sendgrid':
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 465,
        secure: true,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      })

    case 'resend':
      return nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      })

    case 'smtp':
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '1025'),
        secure: process.env.SMTP_PORT === '465',
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            }
          : undefined,
      })

    default:
      throw new Error(`Unknown email provider: ${emailProvider}`)
  }
}

export async function sendEmail(options: EmailOptions) {
  try {
    const transporter = await createTransporter()

    const result = await transporter.sendMail({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Email send failed:', error)
    return { success: false, error: String(error) }
  }
}

// Email templates
export const emailTemplates = {
  passwordReset: (resetUrl: string, name: string) => ({
    subject: 'Восстановление пароля | DelivEM',
    html: `
      <h2>Привет, ${name}!</h2>
      <p>Вы запросили восстановление пароля для вашего аккаунта DelivEM.</p>
      <p><a href="${resetUrl}" style="background-color: #FF6B35; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Восстановить пароль</a></p>
      <p>Ссылка действительна 1 час. Если это были не вы, просто проигнорируйте это письмо.</p>
    `,
    text: `Ссылка для восстановления пароля: ${resetUrl}`,
  }),

  confirmation: (confirmUrl: string, name: string) => ({
    subject: 'Подтверждение email | DelivEM',
    html: `
      <h2>Добро пожаловать, ${name}!</h2>
      <p>Спасибо за регистрацию в DelivEM.</p>
      <p><a href="${confirmUrl}" style="background-color: #FF6B35; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Подтвердить email</a></p>
      <p>Ссылка действительна 24 часа.</p>
    `,
    text: `Ссылка подтверждения: ${confirmUrl}`,
  }),

  notification: (title: string, message: string, details?: string) => ({
    subject: `Уведомление | ${title}`,
    html: `
      <h2>${title}</h2>
      <p>${message}</p>
      ${details ? `<p>${details}</p>` : ''}
    `,
    text: `${title}\n${message}${details ? '\n' + details : ''}`,
  }),

  feedback: (name: string, email: string, message: string) => ({
    subject: 'Новое сообщение обратной связи | DelivEM',
    html: `
      <h2>Новое сообщение обратной связи</h2>
      <p><strong>От:</strong> ${name} (${email})</p>
      <p><strong>Сообщение:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
    text: `Имя: ${name}\nEmail: ${email}\nСообщение:\n${message}`,
  }),
}
