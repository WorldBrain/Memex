import { SearchEngineName } from './types'

const SEARCH_ENGINE_NAMES: { [Name in SearchEngineName]: true } = {
    google: true,
    duckduckgo: true,
}

export function shouldIncludeSearchInjection(host: string): boolean {
    for (const name of Object.keys(SEARCH_ENGINE_NAMES)) {
        if (host.indexOf(name) !== -1) {
            return true
        }
    }

    return false
}
