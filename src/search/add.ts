import { VisitInteraction, PageAddRequest } from '.'
import pipeline, { transformUrl } from './pipeline'
import { PipelineReq } from './types'
import { initErrHandler } from './storage'
import PageStorage from 'src/page-indexing/background/storage'
import BookmarksStorage from 'src/bookmarks/background/storage'

/**
 * Adds/updates a page + associated visit (pages never exist without either an assoc.
 *  visit or bookmark in current model).
 */
export const addPage = (
    pageStorage: PageStorage,
    bookmarksStorage: BookmarksStorage,
) => async ({
    visits = [],
    bookmark,
    pageDoc,
    rejectNoContent,
}: Partial<PageAddRequest>) => {
    const { favIconURI, ...pageData } = await pipeline({
        pageDoc,
        rejectNoContent,
    })

    await pageStorage.createOrUpdatePage(pageData)

    // Create Visits for each specified time, or a single Visit for "now" if no assoc event
    visits = !visits.length && bookmark == null ? [Date.now()] : visits
    await pageStorage.createVisitsIfNeeded(pageData.url, visits)

    if (bookmark != null) {
        await bookmarksStorage.createBookmarkIfNeeded(pageData.url, bookmark)
    }

    if (favIconURI != null) {
        await pageStorage.createFavIconIfNeeded(pageData.hostname, favIconURI)
    }
}

export const addPageTerms = (pageStorage: PageStorage) => async (
    pipelineReq: PipelineReq,
) => {
    const pageData = await pipeline(pipelineReq)
    await pageStorage.createOrUpdatePage(pageData)
}

/**
 * Updates an existing specified visit with interactions data.
 */
export const updateTimestampMeta = (pageStorage: PageStorage) => async (
    url: string,
    time: number,
    data: Partial<VisitInteraction>,
) => {
    return pageStorage.updateVisitMetadata({ url, time }, data)
}

export const addVisit = (pageStorage: PageStorage) => async (
    url: string,
    time = Date.now(),
) => {
    const pageExists = await pageStorage.pageExists(url)
    if (!pageExists) {
        throw new Error(`Cannot add visit for non-existent page: ${url}`)
    }
    await pageStorage.addPageVisit(url, time).catch(initErrHandler())
}

export const addFavIcon = (pageStorage: PageStorage) => async (
    url: string,
    favIconURI: string | Blob,
) => {
    const { hostname } = transformUrl(url)

    await pageStorage
        .createOrUpdateFavIcon(hostname, favIconURI)
        .catch(initErrHandler())
}
