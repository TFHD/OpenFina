import { Hono } from 'hono'
import { corsMiddleware } from './middleware/cors.ts'
import { logMiddleware } from './middleware/log.ts'
import { whitelistMiddleware } from './middleware/whitelist.ts'
import { authRoutes } from './routes/auth.ts'
import { bankRoutes } from './routes/bank.ts'
import { categorizationRoutes } from './routes/categorization.ts'
import { investmentRoutes } from './routes/investment.ts'
import { loanRoutes } from './routes/loan.ts'
import { miscellaneousRoutes } from './routes/miscellaneous.ts'
import { transactionRoutes } from './routes/transaction.ts'
import { webhookRoutes } from './routes/webhook.ts'
import { webviewRoutes } from './routes/webview.ts'
import { initDb } from './db.ts'

export async function createApp(): Promise<Hono> {
    await initDb()

    const app = new Hono()

    app.use('*', logMiddleware)
    app.use('*', corsMiddleware)
    app.use('*', whitelistMiddleware)

    app.route('/', miscellaneousRoutes)
    app.route('/', webhookRoutes)
    app.route('/', bankRoutes)
    app.route('/', investmentRoutes)
    app.route('/', loanRoutes)
    app.route('/', transactionRoutes)
    app.route('/', categorizationRoutes)
    app.route('/', authRoutes)
    app.route('/', webviewRoutes)

    return app
}
