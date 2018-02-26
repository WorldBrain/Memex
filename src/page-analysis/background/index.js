import { whenPageDOMLoaded } from 'src/util/tab-events'
import { remoteFunction } from 'src/util/webextensionRPC'
import whenAllSettled from 'when-all-settled'

import getFavIcon from './get-fav-icon'
import makeScreenshot from './make-screenshot'

/**
 * @typedef {Object} PageAnalysisResult
 * @property {string} content Object containing `fullText`, and other meta data extracted from the DOM.
 * @property {string} [favIcon] Data URL representing the favicon.
 * @property {string} [screenshot] Data URL representing the screenshot.
 */

/**
 * Performs page content analysis on a given Tab's ID.
 *
 * @param {number} args.tabId ID of browser tab to use as data source.
 * @returns {Promise<PageAnalysisResult>}
 */
export default async function analysePage({ tabId }) {
    // Wait until its DOM has loaded, in case we got invoked before that.
    await whenPageDOMLoaded({ tabId })

    // Set up to run these functions in the content script in the tab.
    const extractPageContent = remoteFunction('extractPageContent', { tabId })

    // Fetch the data
    const dataFetchingPromises = [
        getFavIcon({ tabId }),
        makeScreenshot({ tabId }),
        extractPageContent(),
    ]

    // When every task has either completed or failed, return what we got
    const [favIcon, screenshot, content] = await whenAllSettled(
        dataFetchingPromises,
    )
    return { favIcon, screenshot, content }
}
