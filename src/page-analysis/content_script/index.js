import { makeRemotelyCallable } from 'src/util/webextensionRPC'

import extractPageContent from './extract-page-content'
import freezeDry from 'src/freeze-dry'


makeRemotelyCallable({
    extractPageContent,
    freezeDry,
})
