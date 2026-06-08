import 'dotenv/config'

function required(name: string): string {
    const value = process.env[name]
    if (!value) throw new Error(`Missing required environment variable: ${name}`)
    return value
}

function durationMs(value: string, fallback: number): number {
    if (!value) return fallback
    const match = value.match(/^(\d+)(ms|s|m)$/)
    if (!match) return fallback
    const amount = Number(match[1])
    const unit = match[2]
    if (unit === 'ms') return amount
    if (unit === 's') return amount * 1000
    return amount * 60_000
}

export const config = {
    server: {
        port: Number(process.env.SERVER_PORT ?? 8080),
        timeoutRead: durationMs(process.env.SERVER_TIMEOUT_READ ?? '', 3000),
        timeoutWrite: durationMs(process.env.SERVER_TIMEOUT_WRITE ?? '', 5000),
        timeoutIdle: durationMs(process.env.SERVER_TIMEOUT_IDLE ?? '', 5000),
        logLevel: process.env.SERVER_LOG_LEVEL ?? 'info',
    },
    db: {
        host: required('DB_HOST'),
        port: Number(required('DB_PORT')),
        name: required('DB_NAME'),
        user: required('DB_USER'),
        password: required('DB_PASS'),
    },
    powens: {
        clientId: required('POWENS_CLIENT_ID'),
        clientSecret: required('POWENS_CLIENT_SECRET'),
        domain: required('POWENS_DOMAIN'),
        webviewUrl: required('POWENS_WEBVIEW_URL'),
        redirectUrl: required('POWENS_REDIRECT_URL'),
        whitelistedIps: required('POWENS_WHITELISTED_IPS').split(',').map((ip) => ip.trim()),
    },
    other: {
        language: required('OTHER_LANGUAGE'),
    },
    ollama: {
        host: process.env.OLLAMA_HOST ?? 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL ?? 'qwen2.5:7b',
        batchSize: Number(process.env.OLLAMA_BATCH_SIZE ?? 10),
    },
}
