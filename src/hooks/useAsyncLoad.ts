import { useCallback, useEffect, useState } from 'react'

function toErrorMessage(err: unknown, fallback: string): string {
    return err instanceof Error ? err.message : fallback
}

export function useAsyncLoad<T>(
    fetcher: () => Promise<T>,
    fallbackError = 'Erreur inconnue',
) {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const reload = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            setData(await fetcher())
        } catch (err) {
            setError(toErrorMessage(err, fallbackError))
        } finally {
            setLoading(false)
        }
    }, [fetcher, fallbackError])

    useEffect(() => {
        let cancelled = false

        ;(async () => {
        try {
            const result = await fetcher()
            if (!cancelled) {
                setError(null)
                setData(result)
            }
        } catch (err) {
            if (!cancelled) setError(toErrorMessage(err, fallbackError))
        } finally {
            if (!cancelled) setLoading(false)
        }
        })()

        return () => {
        cancelled = true
        }
    }, [fetcher, fallbackError])

    return { data, loading, setLoading, error, reload }
}
