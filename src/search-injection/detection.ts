import { SearchEngineName } from './types'

const SEARCH_ENGINE_NAMES: { [Name in SearchEngineName]: true } = {
    google: true,
    duckduckgo: true,
    brave: true,
    bing: true,
}

const EXLUDED_SUBSECTION = ['&tbm=shop']

export function shouldIncludeSearchInjection(
    host: string,
    url: string,
): boolean {
    for (const name of Object.keys(SEARCH_ENGINE_NAMES)) {
        if (host.indexOf(name) !== -1) {
            for (const excluded of EXLUDED_SUBSECTION)
                if (url.includes(excluded) === true) {
                    return false
                }
            return true
        }
    }

    return false
}
