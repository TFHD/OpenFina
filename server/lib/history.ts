import { formatLocalDate, parseLocalDate } from './dates.ts'

export interface HistoryValue {
    bankAccountId: number
    valuation: number
    dateValuation: string
}

export interface HistoryValuePoint {
    Valuation: number
    DateValuation: string
}

function parseDate(date: string): Date {
    return parseLocalDate(date)
}

function formatDate(date: Date): string {
    return formatLocalDate(date)
}

function addDays(date: Date, days: number): Date {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return next
}

function startOfToday(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function extendMapToToday(
    lastDate: Date,
    lastValuation: number,
    mappedValues: Map<string, number>,
): void {
    const today = startOfToday()
    let cursor = new Date(lastDate)

    while (addDays(cursor, 1) < today) {
        cursor = addDays(cursor, 1)
        mappedValues.set(formatDate(cursor), lastValuation)
    }
}

export function generateInitialValueDatePairs(
    bankAccountId: number,
    historyValues: HistoryValue[],
): Map<string, number> {
    const mappedValues = new Map<string, number>()

    const accountValues = historyValues.filter((point) => point.bankAccountId === bankAccountId)
    if (accountValues.length === 0) return mappedValues

    let previousPoint = accountValues[0]

    for (const point of accountValues) {
        const previousTime = parseDate(previousPoint.dateValuation)
        const parsedTime = parseDate(point.dateValuation)

        let daysDiff = 0
        while (addDays(previousTime, daysDiff) < parsedTime) {
            mappedValues.set(
                formatDate(addDays(previousTime, daysDiff)),
                previousPoint.valuation,
            )
            daysDiff += 1
        }

        previousPoint = point
    }

    const lastPoint = accountValues[accountValues.length - 1]
    const lastTime = parseDate(lastPoint.dateValuation)
    mappedValues.set(formatDate(lastTime), lastPoint.valuation)
    extendMapToToday(lastTime, lastPoint.valuation, mappedValues)

    return mappedValues
}

export function aggregateHistoryPoints(
    historyValues: HistoryValue[],
): HistoryValuePoint[] {
    const bankAccountIds = [...new Set(historyValues.map((point) => point.bankAccountId))].sort(
        (a, b) => a - b,
    )

    const constructed = new Map<string, number>()

    for (const bankAccountId of bankAccountIds) {
        const nextHistoryValues = generateInitialValueDatePairs(bankAccountId, historyValues)

        for (const [date, value] of nextHistoryValues) {
            constructed.set(date, (constructed.get(date) ?? 0) + value)
        }
    }

    return [...constructed.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, valuation]) => ({
            Valuation: valuation,
            DateValuation: date,
        }))
    }

    export function historyPointsForAccount(
    bankAccountId: number,
    historyValues: HistoryValue[],
    ): HistoryValuePoint[] {
    const constructed = generateInitialValueDatePairs(bankAccountId, historyValues)

    return [...constructed.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, valuation]) => ({
            Valuation: valuation,
            DateValuation: date,
        }))
}

