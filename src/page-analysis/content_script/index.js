import { makeRemotelyCallable } from 'src/util/webextensionRPC'

import extractPageText from './extract-page-text'
import extractPageMetadata from './extract-page-metadata'

makeRemotelyCallable({
    extractPageText,
    extractPageMetadata,
})
