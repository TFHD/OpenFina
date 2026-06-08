export function normalizeDateValue(value: unknown): string {
    if (value instanceof Date)
        return formatLocalDate(value)

    const str = String(value).trim()
    const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})/)
    if (isoMatch) return isoMatch[1]

    const parsed = new Date(str)
    if (Number.isNaN(parsed.getTime()))
        throw new RangeError(`Invalid time value: ${str}`)

    return formatLocalDate(parsed)
}

export function formatLocalDate(date: Date): string {
    if (Number.isNaN(date.getTime()))
        throw new RangeError('Invalid time value')

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function formatDateTimeForMysql(value: unknown): string {
    if (value instanceof Date) {
        return formatDateTimeLocal(value)
    }

    const str = String(value).trim()

    const mysqlMatch = str.match(
        /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/,
    )
    if (mysqlMatch) return `${mysqlMatch[1]} ${mysqlMatch[2]}`

    const dateOnlyMatch = str.match(/^(\d{4}-\d{2}-\d{2})$/)
    if (dateOnlyMatch) return `${dateOnlyMatch[1]} 00:00:00`

    const parsed = new Date(str)
    if (Number.isNaN(parsed.getTime()))
        throw new RangeError(`Invalid datetime value: ${str}`)

    return formatDateTimeLocal(parsed)
}

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function parseLocalDate(date: string): Date {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match)
        throw new RangeError(`Invalid date format: ${date}`)

    const parsed = new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
    )

    if (Number.isNaN(parsed.getTime()))
        throw new RangeError(`Invalid time value: ${date}`)

    return parsed
}
