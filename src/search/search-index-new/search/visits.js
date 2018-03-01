import db, { Storage } from '..'

/**
 * Goes through visits index by most recent and groups by URL, mapping URLs to latest
 * visit times.
 *
 * TODO: Better pagination; probably no need to go back every time when just changing pages.
 *   Maybe look into memoization or caching.
 *
 * @param {number} [args.startTime=0] Lower-bound for visit time.
 * @param {number} [args.endTime=Date.now()] Upper-bound for visit time.
 * @param {number} [args.skip=0]
 * @param {number} [args.limit=10]
 * @param {Set<string>} urlScopeSet Set of URLs to only include, if there are any defined.
 * @return {Map<string, number>} Map of URL keys to latest visit time numbers. Should be size <= skip + limit.
 */
export async function getLatestVisitsByUrl(
    { startTime = 0, endTime = Date.now(), skip = 0, limit = 10 },
    urlScopeSet,
    shallowLookback = false,
) {
    const latestVisitsByUrl = new Map()
    const shouldRecord = url =>
        !latestVisitsByUrl.has(url) && urlScopeSet.size > 0
            ? urlScopeSet.has(url)
            : true

    let visitColl = db.visits
        .where('[time+url]')
        .between([startTime, Storage.MIN_STR], [endTime, Storage.MAX_STR])
        .reverse() // Go through visits by most recent

    // Blank search can be a bit faster as we don't need to intersected Pages to meet result limit
    if (shallowLookback) {
        visitColl = visitColl.until(() => latestVisitsByUrl.size > skip + limit)
    }

    await visitColl.eachPrimaryKey(([time, url]) => {
        // Only ever record the first (latest) visit for each URL
        if (shouldRecord(url)) {
            latestVisitsByUrl.set(url, time)
        }
    })

    return latestVisitsByUrl
}
