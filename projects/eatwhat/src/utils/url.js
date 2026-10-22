export function normalizeHttpUrl(value) {
    try {
        const url = new URL(value)

        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return null
        }

        return url.href
    } catch {
        return null
    }
}