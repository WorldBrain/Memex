import db from '.'
import normalizeUrl from 'src/util/encode-url-for-id'
import { Page } from './models'
import pipeline from './pipeline'

/**
 * @typedef {Object} VisitInteraction
 * @property {number} duration Time user was active during visit (ms).
 * @property {number} scrollPx Y-axis pixel scrolled to at point in time.
 * @property {number} scrollPerc
 * @property {number} scrollMaxPx Furthest y-axis pixel scrolled to during visit.
 * @property {number} scrollMaxPerc
 */

/**
 * @typedef {Object} PageAddRequest
 * @property {any} pageData TODO: type
 * @property {number[]} [visits=[]] Opt. visit times to assoc. with Page.
 * @property {number} [bookmark] Opt. bookmark time to assoc. with Page.
 */

/**
 * Adds/updates a page + associated visit (pages never exist without either an assoc.
 *  visit or bookmark in current model).
 *
 * @param {PageAddReq} req
 * @return {Promise<void>}
 */
export async function addPage({ visits = [], bookmark, ...pipelineReq }) {
    const pageData = await pipeline(pipelineReq)

    return db
        .transaction('rw', db.tables, async () => {
            const page = new Page(pageData)
            // Load any current assoc. data for this page
            await page.loadRels()

            // If no meta event times supplied, create a new Visit for now
            const shouldCreateVisit = !visits.length && bookmark == null

            // Create Visits for each specified time, or a single Visit for "now" if no assoc event
            visits = shouldCreateVisit ? [Date.now()] : visits
            visits.forEach(time => page.addVisit(time))

            // Create bookmark, if given
            if (bookmark != null) {
                page.setBookmark(bookmark)
            }

            // Persist current state
            await page.save()
            console.log('added:', page)
        })
        .catch(console.error)
}

/**
 * @param {PageAddReq} req
 * @return {Promise<void>}
 */
export async function addPageTerms(req) {
    const { url, terms, text } = await pipeline(req)

    return db.transaction('rw', db.pages, async () => {
        await db.pages.update(url, { terms, text })

        console.log(`added ${terms.length} terms to page: ${url}`)
    })
}

/**
 * Updates an existing specified visit with interactions data.
 *
 * @param {string} url The URL of the visit to get.
 * @param {string|number} time
 * @param {VisitInteraction} data
 * @return {Promise<void>}
 */
export async function updateTimestampMeta(url, time, data) {
    const normalized = normalizeUrl(url)

    return db.transaction('rw', db.visits, () =>
        db.visits
            .where('[time+url]')
            .equals([time, normalized])
            .modify(data),
    )
}

export async function addVisit(url, time = Date.now()) {
    const normalized = normalizeUrl(url)

    return db.transaction('rw', db.tables, async () => {
        const matchingPage = await db.pages.get(normalized)
        if (matchingPage == null) {
            throw new Error(
                `Cannot add visit for non-existent page: ${normalized}`,
            )
        }

        await matchingPage.loadRels()
        matchingPage.addVisit(time)
        return await matchingPage.save()
    })
}
