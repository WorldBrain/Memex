import { whenPageDOMLoaded } from 'src/util/tab-events'
import whenAllSettled from 'when-all-settled'

import getFavIcon from './get-fav-icon'
import makeScreenshot from './make-screenshot'
import { runInTab } from 'src/util/webextensionRPC'
import { PageAnalyzerInterface } from 'src/page-analysis/types'

export type PageAnalyzer = (args: {
    tabId: number
    allowContent?: boolean
    allowScreenshot?: boolean
    allowFavIcon?: boolean
}) => Promise<{
    favIconURI: string
    screenshotURI: string
    content: any
}>

/**
 * Performs page content analysis on a given Tab's ID.
 */
const analysePage: PageAnalyzer = async ({
    tabId,
    allowContent = true,
    allowScreenshot = true,
    allowFavIcon = true,
}) => {
    // Wait until its DOM has loaded, in case we got invoked before that.
    await whenPageDOMLoaded({ tabId })

    // Set up to run these functions in the content script in the tab.
    const extractPageContent = runInTab<PageAnalyzerInterface>(tabId)
        .extractPageContent

    // Fetch the data
    const dataFetchingPromises = [
        allowContent ? extractPageContent() : Promise.resolve(),
        allowScreenshot ? makeScreenshot({ tabId }) : Promise.resolve(),
        allowFavIcon ? getFavIcon({ tabId }) : Promise.resolve(),
    ]

    // When every task has either completed or failed, return what we got
    const [content, screenshotURI, favIconURI] = await whenAllSettled(
        dataFetchingPromises,
        {
            onRejection: err => undefined,
        },
    )
    return { favIconURI, screenshotURI, content: content || {} }
}

export default analysePage
