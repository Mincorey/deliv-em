import * as Sentry from '@sentry/nextjs'

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.log('Sentry DSN not configured, error tracking disabled')
    return
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

export function captureException(error: Error | string, context?: Record<string, any>) {
  if (!process.env.SENTRY_DSN) {
    console.error('Error:', error, context)
    return
  }

  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  })
}

export function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info') {
  if (!process.env.SENTRY_DSN) {
    console.log(message)
    return
  }

  Sentry.captureMessage(message, level)
}
