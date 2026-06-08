import { config } from './config.ts'

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error'

const levels: Record<LogLevel, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
}

const currentLevel = levels[config.server.logLevel as LogLevel] ?? levels.info

const reset = '\x1b[0m'
const dim = '\x1b[2m'
const bold = '\x1b[1m'

const levelStyles: Record<LogLevel, { badge: string; text: string }> = {
    trace: { badge: '\x1b[90m', text: '\x1b[90m' },
    debug: { badge: '\x1b[36m', text: '\x1b[36m' },
    info: { badge: '\x1b[32m', text: '\x1b[32m' },
    warn: { badge: '\x1b[33m', text: '\x1b[33m' },
    error: { badge: '\x1b[31m', text: '\x1b[31m' },
}

const methodColors: Record<string, string> = {
    GET: '\x1b[32m',
    POST: '\x1b[34m',
    PUT: '\x1b[33m',
    PATCH: '\x1b[35m',
    DELETE: '\x1b[31m',
    OPTIONS: '\x1b[90m',
}

function shouldLog(level: LogLevel): boolean {
    return levels[level] >= currentLevel
}

function timestamp(): string {
    return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

function levelBadge(level: LogLevel): string {
    const style = levelStyles[level]
    return `${style.badge}${bold}${level.toUpperCase().padEnd(5)}${reset}`
}

function formatExtra(extra: Record<string, unknown>): string {
    if ('method' in extra && 'url' in extra) {
        const method = String(extra.method)
        const url = String(extra.url)
        const remoteIp = String(extra.remote_ip ?? '')
        const latency = extra.msLatency
        const methodColor = methodColors[method] ?? '\x1b[37m'

        const parts = [
            `${methodColor}${bold}${method.padEnd(7)}${reset}`,
            `\x1b[96m${url}${reset}`,
            remoteIp ? `${dim}${remoteIp}${reset}` : '',
            latency !== undefined ? `${dim}${latency}ms${reset}` : '',
        ].filter(Boolean)

        return parts.join(' ')
    }

    const entries = Object.entries(extra)
    if (entries.length === 0) return ''

    return entries
        .map(([key, value]) => `${dim}${key}=${reset}\x1b[97m${formatValue(value)}${reset}`)
        .join(`${dim} · ${reset}`)
}

function formatValue(value: unknown): string {
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    return JSON.stringify(value)
}

function formatLine(level: LogLevel, message: string, extra?: Record<string, unknown>): string {
    const style = levelStyles[level]
    const time = `${dim}${timestamp()}${reset}`
    const badge = levelBadge(level)
    const text = message
        ? `${style.text}${message}${reset}`
        : extra
        ? formatExtra(extra)
        : ''

    if (message && extra && Object.keys(extra).length > 0)
        return `${time} ${badge} ${text} ${dim}│${reset} ${formatExtra(extra)}`

    return `${time} ${badge} ${text}`
}

function write(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
    if (!shouldLog(level)) return

    const line = formatLine(level, message, extra)
    if (level === 'error') console.error(line)
    else if (level === 'warn')  console.warn(line)
    else console.log(line)
}

export const logger = {
    trace(message: string, extra?: Record<string, unknown>) {
        write('trace', message, extra)
    },
    debug(message: string, extra?: Record<string, unknown>) {
        write('debug', message, extra)
    },
    info(message: string, extra?: Record<string, unknown>) {
        write('info', message, extra)
    },
    warn(message: string, extra?: Record<string, unknown>) {
        write('warn', message, extra)
    },
    error(message: string, extra?: Record<string, unknown>) {
        write('error', message, extra)
    },
}
