import moment from 'moment'

import tabManager from './tab-manager'
import analysePage from '../../page-analysis/background'
import searchIndex from '../../search'

/**
 * Performs page data indexing for a browser tab. Immediately
 * indexes display data, and searchable title/URL terms, but returns
 * an async callback for manual invocation of text indexing.
 */
async function logPageVisit(tab, secsSinceLastVisit = 20) {
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
                console.log('skipping page due to recent visit:', tab.url)
                tabManager.clearScheduledLog(tab.id)

                return await searchIndex.addVisit(
                    tab.url,
                    internalTabState.visitTime,
                )
            }
        }

        const allowFavIcon = !await searchIndex.domainHasFavIcon(tab.url)
        const analysisRes = await analysePage({ tabId: tab.id, allowFavIcon })

        // Don't index full-text in this stage
        const contentCopy = { ...analysisRes.content }
        delete analysisRes.content.fullText

        console.log('indexing page:', tab.url)
        await searchIndex.addPage({
            pageDoc: { url: tab.url, ...analysisRes },
            visits: [internalTabState.visitTime],
            rejectNoContent: false,
        })

        // Return function to afford manual invoking text indexing
        return () =>
            searchIndex.addPageTerms({
                pageDoc: { url: tab.url, content: contentCopy },
            })
    } catch (err) {
        tabManager.clearScheduledLog(tab.id)
        throw err
    }
}

export default logPageVisit
