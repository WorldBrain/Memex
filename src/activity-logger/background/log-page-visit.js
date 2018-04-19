import moment from 'moment'

import analysePage from 'src/page-analysis/background'
import * as index from 'src/search'
import tabManager from './tab-manager'

/**
 * Performs initial page indexing on small amount of available content (title, URL) + visit.
 *
 * @param {number} tabId
 * @param {number} [secsSinceLastIndex=20]
 */
export async function logInitPageVisit(tabId, secsSinceLastIndex = 20) {
    const tab = await browser.tabs.get(tabId)
    console.log('indexing page title & url:', tab.url)

    const { visitTime } = tabManager.getTabState(tabId)

    try {
        const existingPage = await index.getPage(tab.url)

        if (existingPage != null) {
            // Store just new visit if existing page has been indexed recently (`secsSinceLastIndex`)
            //  also clear scheduled content indexing
            if (
                moment(existingPage.latest).isAfter(
                    moment(+visitTime).subtract(secsSinceLastIndex, 'seconds'),
                )
            ) {
                tabManager.clearScheduledLog(tabId)
                return await index.addVisit(tab.url, +visitTime)
            }
        }

        const allowFavIcon = !await index.domainHasFavIcon(tab.url)
        const analysisRes = await analysePage({ tabId, allowFavIcon })

        // Don't index full-text just yet
        delete analysisRes.content.fullText

        await index.addPage({
            pageDoc: { url: tab.url, ...analysisRes },
            visits: [visitTime],
            rejectNoContent: false,
        })
    } catch (err) {
        // If any problems in this stage, clear the later-scheduled content indexing stage
        tabManager.clearScheduledLog(tabId)
        throw err
    }
}

/**
 * Performs page content indexing page text, screenshot, etc. Should happen only after a user has been active on a
 * tab for a certain amount of time.
 *
 * @param {number} tabId
 */
export async function logPageVisit(tabId) {
    const { url } = await browser.tabs.get(tabId)

    // Call `analysePage` again, this time just to get full terms
    const { content } = await analysePage({
        tabId,
        allowScreenshot: false,
        allowFavIcon: false,
    })

    // Index all the terms for the page
    await index.addPageTerms({
        pageDoc: { url, content },
    })
}
