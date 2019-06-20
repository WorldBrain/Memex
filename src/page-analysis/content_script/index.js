import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import extractPageContent from './extract-page-content'
import { PageAnalyzerInterface } from 'src/page-analysis/types'

makeRemotelyCallable <
    PageAnalyzerInterface >
    {
        extractPageContent,
    }
