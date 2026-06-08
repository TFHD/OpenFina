import { Hono } from 'hono'

export const miscellaneousRoutes = new Hono()

miscellaneousRoutes.get('/health/', (c) => c.text('Healthy'))

miscellaneousRoutes.get('/version/', (c) => c.text('0.0.1'))
