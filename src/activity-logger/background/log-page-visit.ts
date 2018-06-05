import { Tabs } from 'webextension-polyfill-ts'
import moment from 'moment'

import tabManager from './tab-manager'
import analysePage from '../../page-analysis/background'
import searchIndex from '../../search'

/**
 * Performs page data indexing for a browser tab. Immediately
 * indexes display data, and searchable title/URL terms, but returns
 * an async callback for manual invocation of text indexing.
 */
export async function logPageStub(tab: Tabs.Tab, secsSinceLastVisit = 20) {
    const internalTabState = tabManager.getTabState(tab.id)

    // Cannot process if tab not tracked
    if (internalTabState == null) {
        return
    }

    try {
        const existingPage = await searchIndex.getPage(tab.url)

        if (existingPage != null) {
            // Store just new visit if existing page has been indexed recently (`secsSinceLastIndex`)
            //  also clear scheduled content indexing
            if (
                moment(existingPage.latest).isAfter(
                    moment(internalTabState.visitTime).subtract(
                        secsSinceLastVisit,
                        'seconds',
                    ),
                )
            ) {
                tabManager.clearScheduledLog(tab.id)

                return await searchIndex.addVisit(
                    tab.url,
                    internalTabState.visitTime,
                )
            }
        }

        const allowFavIcon = !(await searchIndex.domainHasFavIcon(tab.url))
        const analysisRes = await analysePage({ tabId: tab.id, allowFavIcon })

        // Don't index full-text in this stage
        delete analysisRes.content.fullText

        await searchIndex.addPage({
            pageDoc: { url: tab.url, ...analysisRes },
            visits: [internalTabState.visitTime],
            rejectNoContent: false,
        })
    } catch (err) {
        tabManager.clearScheduledLog(tab.id)
        throw err
    }
}

export async function logPageVisit(tab: Tabs.Tab, textOnly = true) {
    const analysisRes = await analysePage({
        tabId: tab.id,
        allowFavIcon: false,
        allowScreenshot: !textOnly,
    })

    const pageDoc = { url: tab.url, ...analysisRes }

    if (textOnly) {
        return searchIndex.addPageTerms({ pageDoc })
    }

    const internalTabState = tabManager.getTabState(tab.id)

    // Cannot process if tab not tracked
    if (internalTabState == null) {
        return
    }

    await searchIndex.addPage({
        pageDoc,
        visits: [internalTabState.visitTime],
    })
}
