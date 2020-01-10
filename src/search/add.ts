import { normalizeUrl } from '@worldbrain/memex-url-utils'

import { VisitInteraction, PageAddRequest } from '.'
import pipeline, { transformUrl } from './pipeline'
import { Page, FavIcon } from './models'
import { getPage } from './util'
import { PipelineReq, DBGet } from './types'
import { initErrHandler } from './storage'

/**
 * Adds/updates a page + associated visit (pages never exist without either an assoc.
 *  visit or bookmark in current model).
 */
export const addPage = (getDb: DBGet) => async ({
    visits = [],
    bookmark,
    pageDoc,
    rejectNoContent,
}: Partial<PageAddRequest>) => {
    const db = await getDb()
    const { favIconURI, ...pageData } = await pipeline({
        pageDoc,
        rejectNoContent,
    })

    const page = new Page(db, pageData)
    await page.loadRels()

    // Create Visits for each specified time, or a single Visit for "now" if no assoc event
    visits = !visits.length && bookmark == null ? [Date.now()] : visits
    visits.forEach(time => page.addVisit(time))

    if (bookmark != null) {
        page.setBookmark(bookmark)
    }

    if (favIconURI != null) {
        await new FavIcon(db, {
            hostname: page.hostname,
            favIconURI,
        }).save()
    }
    await page.save()
}

export const addPageTerms = (getDb: DBGet) => async (
    pipelineReq: PipelineReq,
) => {
    const db = await getDb()
    const pageData = await pipeline(pipelineReq)

    const page = new Page(db, pageData)
    await page.loadRels()
    await page.save()
}

/**
 * Updates an existing specified visit with interactions data.
 */
export const updateTimestampMeta = (getDb: DBGet) => async (
    url: string,
    time: number,
    data: Partial<VisitInteraction>,
) => {
    const db = await getDb()
    const normalized = normalizeUrl(url)

    return db
        .collection('visits')
        .updateObjects({ time, url: normalized }, { $set: data })
        .catch(initErrHandler())
}

export const addVisit = (getDb: DBGet) => async (
    url: string,
    time = Date.now(),
) => {
    const matchingPage = await getPage(getDb)(url)

    if (matchingPage == null) {
        throw new Error(`Cannot add visit for non-existent page: ${url}`)
    }

    matchingPage.addVisit(time)
    return matchingPage.save().catch(initErrHandler())
}

export const addFavIcon = (getDb: DBGet) => async (
    url: string,
    favIconURI: string,
) => {
    const db = await getDb()
    const { hostname } = transformUrl(url)

    return new FavIcon(db, { hostname, favIconURI })
        .save()
        .catch(initErrHandler())
}
