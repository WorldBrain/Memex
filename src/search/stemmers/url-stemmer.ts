import textStemmer from '@worldbrain/memex-stemmer/ts'
import { Stemmer } from '@worldbrain/storex-backend-dexie'
import { extractUrlParts } from '@worldbrain/memex-common/ts/url-utils/extract-parts'

const stemmer: Stemmer = (url) => {
    let { pathname } = extractUrlParts(url)
    if (pathname == null) {
        return new Set()
    }

    pathname = pathname.replace(/-/g, ' ')
    return textStemmer(pathname)
}

export default stemmer
