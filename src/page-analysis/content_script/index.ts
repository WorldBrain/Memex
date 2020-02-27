import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import extractPageContent from './extract-page-content'

export const setupPageContentRPC = () =>
    makeRemotelyCallable({
        extractPageContent,
    })
