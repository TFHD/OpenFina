import { getApiBaseUrl } from '../lib/settings'

class ApiError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

async function request<T>(
    path: string,
    init?: RequestInit,
): Promise<T> {
    const base = getApiBaseUrl()
    const url = `${base}${path}`
    const response = await fetch(url, {
        ...init,
        headers: {
            Accept: 'application/json',
            ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
            ...init?.headers,
        },
    })

    if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new ApiError(response.status, text || response.statusText)
    }

    if (response.status === 204) return undefined as T

    const contentType = response.headers.get('content-type') ?? ''
    const text = await response.text()

    if (!text) return undefined as T

    if (contentType.includes('application/json') || text.startsWith('[') || text.startsWith('{'))
        return JSON.parse(text) as T

    return text as T
}

export const api = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
