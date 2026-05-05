type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const logLevelHierarchy: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLogLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'
const currentLogLevelValue = logLevelHierarchy[currentLogLevel]

function shouldLog(level: LogLevel): boolean {
  return logLevelHierarchy[level] >= currentLogLevelValue
}

function formatLog(level: LogLevel, message: string, data?: any): string {
  const timestamp = new Date().toISOString()
  const levelStr = level.toUpperCase().padEnd(5)
  const dataStr = data ? ` ${JSON.stringify(data)}` : ''
  return `[${timestamp}] ${levelStr} ${message}${dataStr}`
}

export const logger = {
  debug: (message: string, data?: any) => {
    if (shouldLog('debug')) {
      console.log(formatLog('debug', message, data))
    }
  },
  info: (message: string, data?: any) => {
    if (shouldLog('info')) {
      console.log(formatLog('info', message, data))
    }
  },
  warn: (message: string, data?: any) => {
    if (shouldLog('warn')) {
      console.warn(formatLog('warn', message, data))
    }
  },
  error: (message: string, error?: any) => {
    if (shouldLog('error')) {
      if (error instanceof Error) {
        console.error(formatLog('error', message, { error: error.message, stack: error.stack }))
      } else {
        console.error(formatLog('error', message, error))
      }
    }
  },
}
