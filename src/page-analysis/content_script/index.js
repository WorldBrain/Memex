import { makeRemotelyCallable } from 'src/util/webextensionRPC'

import extractPageData from './extract-page-data'

makeRemotelyCallable({
    extractPageData,
})
