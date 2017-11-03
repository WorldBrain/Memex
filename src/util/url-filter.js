// Remove unnecessary query params from the URL to avoid redundancy
import normalizeUrl from 'normalize-url'

const NORMALIZE_OPTS = {
    stripWWW: true,
    removeDirectoryIndex: false,
    removeTrailingSlash: false,
    stripFragment: true,
    normalizeProtocol: false,
}

const RULES = new Set(['q'])
export default function urlFilter(url) {
    const parsedUrl = new URL(normalizeUrl(url, NORMALIZE_OPTS))
    for (const param of parsedUrl.searchParams.keys()) {
        if (!RULES.has(param)) {
            parsedUrl.searchParams.delete(param)
        }
    }
    return parsedUrl.href
}
