const EMPTY = '-'

export function parseBackendDate(value: string): Date | null {
    const parsed = new Date(value.replace(' ', 'T'))
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatCurrency(
    value: number | undefined | null,
    currency = 'EUR',
): string {
    if (value == null || Number.isNaN(value)) return EMPTY
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)
}

function formatNumber(
    value: number | undefined | null,
    digits = 2,
): string {
    if (value == null || Number.isNaN(value)) return EMPTY
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(value)
}

export function formatDate(value: string | undefined | null): string {
    if (!value) return EMPTY
    const parsed = parseBackendDate(value)
    if (!parsed) return value
    return parsed.toLocaleDateString('fr-FR')
}

export function formatIban(iban: string | undefined | null): string {
    if (!iban) return EMPTY
    return iban.replace(/(.{4})/g, '$1 ').trim()
}

export function formatPercent(value: number | undefined | null): string {
    if (value == null || Number.isNaN(value)) return EMPTY
    return `${formatNumber(value, 2)} %`
}
