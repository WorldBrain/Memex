import moment from 'moment'

import tabManager from './tab-manager'
import analysePage from '../../page-analysis/background'
import searchIndex from '../../search'

/**
 * Performs page indexing via a browser tab.
 */
async function logPageVisit(tab, secsSinceLastVisit = 20) {
    const internalTabState = tabManager.getTabState(tab.id)

    // Cannot process if tab not tracked
    if (internalTabState == null) {
        return
    }

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
            return await searchIndex.addVisit(
                tab.url,
                internalTabState.visitTime,
            )
        }
    }

    const allowFavIcon = !await searchIndex.domainHasFavIcon(tab.url)
    const analysisRes = await analysePage({ tabId: tab.id, allowFavIcon })

    console.log('indexing page:', tab.url)
    await searchIndex.addPage({
        pageDoc: { url: tab.url, ...analysisRes },
        visits: [internalTabState.visitTime],
        rejectNoContent: true,
    })
}

export default logPageVisit
