import { VisitInteraction, PageAddRequest } from '.'
import normalizeUrl from '../util/encode-url-for-id'
import pipeline, { transformUrl } from './pipeline'
import { Page, FavIcon } from './models'
import { getPage } from './util'
import { PipelineReq, Dexie } from './types'
import { initErrHandler } from './storage'

/**
 * Adds/updates a page + associated visit (pages never exist without either an assoc.
 *  visit or bookmark in current model).
 */
export const addPage = (getDb: Promise<Dexie>) => async ({
    visits = [],
    bookmark,
    pageDoc,
    rejectNoContent,
}: Partial<PageAddRequest>) => {
    const db = await getDb

    const { favIconURI, ...pageData } = await pipeline({
        pageDoc,
        rejectNoContent,
    })

    try {
        await db.transaction('rw', db.tables, async () => {
            const page = new Page(pageData)

            if (favIconURI != null) {
                await new FavIcon({ hostname: page.hostname, favIconURI })
                    .save(getDb)
                    .catch()
            }

            await page.loadRels(getDb)

            // Create Visits for each specified time, or a single Visit for "now" if no assoc event
            visits = !visits.length && bookmark == null ? [Date.now()] : visits
            visits.forEach(time => page.addVisit(time))

            if (bookmark != null) {
                page.setBookmark(bookmark)
            }

            await page.save(getDb)
        })
    } catch (error) {
        console.error(error)
    }
}

export const addPageTerms = (getDb: Promise<Dexie>) => async (
    pipelineReq: PipelineReq,
) => {
    const db = await getDb
    const pageData = await pipeline(pipelineReq)

    try {
        await db.transaction('rw', db.tables, async () => {
            const page = new Page(pageData)
            await page.loadRels(getDb)
            await page.save(getDb)
        })
    } catch (error) {
        console.error(error)
    }
}

/**
 * Updates an existing specified visit with interactions data.
 */
export const updateTimestampMeta = (getDb: Promise<Dexie>) => async (
    url: string,
    time: number,
    data: Partial<VisitInteraction>,
) => {
    const db = await getDb
    const normalized = normalizeUrl(url)

    await db
        .transaction('rw', db.visits, () =>
            db.visits
                .where('[time+url]')
                .equals([time, normalized])
                .modify(data),
        )
        .catch(initErrHandler())
}

export const addVisit = (getDb: Promise<Dexie>) => async (
    url: string,
    time = Date.now(),
) => {
    const matchingPage = await getPage(getDb)(url)

    if (matchingPage == null) {
        throw new Error(`Cannot add visit for non-existent page: ${url}`)
    }

    matchingPage.addVisit(time)
    return matchingPage.save(getDb).catch(initErrHandler())
}

export const addFavIcon = (getDb: Promise<Dexie>) => async (
    url: string,
    favIconURI: string,
) => {
    const { hostname } = transformUrl(url)

    return new FavIcon({ hostname, favIconURI })
        .save(getDb)
        .catch(initErrHandler())
}
