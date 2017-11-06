// Remove unnecessary query params from the URL to avoid redundancy
import normalizeUrl from 'normalize-url'
import filterParams from './filter-params'
const NORMALIZE_OPTS = {
    stripWWW: true,
    removeDirectoryIndex: false,
    removeTrailingSlash: false,
    stripFragment: true,
    normalizeProtocol: false,
}
const filterParamsDict = new Map(Object.entries(filterParams))
export default function urlFilter(url) {
    const parsedUrl = new URL(normalizeUrl(url, NORMALIZE_OPTS))
    const rules = filterParamsDict.get(parsedUrl.hostname)
    if (typeof rules === 'undefined') return parsedUrl.href
    for (const param of parsedUrl.searchParams.keys()) {
        if (!rules.has(param)) {
            parsedUrl.searchParams.delete(param)
        }
    }
    return parsedUrl.href
}
