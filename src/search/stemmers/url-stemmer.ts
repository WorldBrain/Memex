import textStemmer from '@worldbrain/memex-stemmer'
import { Stemmer } from '@worldbrain/storex-backend-dexie'

import { transformUrl } from '../pipeline'

const stemmer: Stemmer = url => {
    // console.log('url:', )
    let { pathname } = transformUrl(url)
    pathname = pathname.replace(/-/g, ' ')
    return textStemmer(pathname)
}

export default stemmer
