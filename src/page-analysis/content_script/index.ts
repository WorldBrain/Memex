import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import extractRawPageContent from './extract-page-content'

export const setupPageContentRPC = () =>
    makeRemotelyCallable({
        extractRawPageContent,
    })
