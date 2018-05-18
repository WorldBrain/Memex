import moment from 'moment'

import analysePage from '../../page-analysis/background'
import searchIndex from '../../search'

/**
 * Performs page indexing via a browser tab.
 */
async function logPageVisit(tab, secsSinceLastVisit = 20) {
    const visitTime = Date.now()
    const existingPage = await searchIndex.getPage(tab.url)

    if (existingPage != null) {
        // Store just new visit if existing page has been indexed recently (`secsSinceLastIndex`)
        //  also clear scheduled content indexing
        if (
            moment(existingPage.latest).isAfter(
                moment(visitTime).subtract(secsSinceLastVisit, 'seconds'),
            )
        ) {
            console.log('skipping page due to recent visit:', tab.url)
            return await searchIndex.addVisit(tab.url, +visitTime)
        }
    }

    const allowFavIcon = !await searchIndex.domainHasFavIcon(tab.url)
    const analysisRes = await analysePage({ tabId: tab.id, allowFavIcon })

    console.log('indexing page:', tab.url)
    await searchIndex.addPage({
        pageDoc: { url: tab.url, ...analysisRes },
        visits: [visitTime],
        rejectNoContent: true,
    })
}

export default logPageVisit
