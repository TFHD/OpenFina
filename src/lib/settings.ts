export function getApiBaseUrl(): string {
  const envBase = import.meta.env.VITE_API_BASE_URL?.trim()
  if (envBase) return envBase.replace(/\/$/, '')
  return ''
}
