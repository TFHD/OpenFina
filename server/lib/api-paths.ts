const API_PREFIXES = [
    '/health/',
    '/version/',
    '/webhook/',
    '/bank_account/',
    '/investment/',
    '/history/',
    '/loan/',
    '/transaction/',
    '/auth/',
    '/webview/',
]

export function isApiPath(url: string): boolean {
    return API_PREFIXES.some((prefix) => url.startsWith(prefix))
}
