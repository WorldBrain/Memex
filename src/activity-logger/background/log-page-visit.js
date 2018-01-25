import moment from 'moment'

import storePage from 'src/page-storage/store-page'
import { generatePageDocId } from 'src/page-storage'
import * as index from 'src/search'
import { visitKeyPrefix } from '..'
import tabManager from './tab-manager'

const singleLookup = index.initSingleLookup()

/**
 * Performs initial page indexing on small amount of available content (title, URL) + visit.
 *
 * @param {number} tabId
 * @param {number} [secsSinceLastIndex=20]
 */
export async function logInitPageVisit(tabId, secsSinceLastIndex = 20) {
    const tab = await browser.tabs.get(tabId)

    const { visitTime } = tabManager.getTabState(tabId)

    const pageId = generatePageDocId({ url: tab.url })
    const visitId = `${visitKeyPrefix}${visitTime}`

    try {
        const existingPage = await singleLookup(pageId)

        // Store just new visit if existing page has been indexed recently (`secsSinceLastIndex`)
        //  also clear scheduled content indexing
        if (
            existingPage != null &&
            moment(+existingPage.latest).isAfter(
                moment(+visitTime).subtract(secsSinceLastIndex, 'seconds'),
            )
        ) {
            return await index.addTimestampConcurrent(pageId, visitId)
        }

        const pageDoc = await storePage({
            tabId,
            url: tab.url,
            content: { title: tab.title },
            runAnalysis: false,
        })

        await index.addPageConcurrent({
            pageDoc,
            visits: [visitTime],
            rejectNoContent: false, // No page content available yet; don't reject during pre-processing pipeline
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

    // Call `storePage` again, this time with analysis enabed to grab and store further page content
    const pageDoc = await storePage({
        tabId,
        url,
        runAnalysis: true,
    })

    // Index all the terms for the page
    await index.addPageTermsConcurrent({ pageDoc })
}
