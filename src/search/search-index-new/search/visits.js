import db, { Storage } from '..'

/**
 * Given some URLs, grab the latest assoc. visit timestamp for each one within the time filter bounds.
 *
 * @param {SearchParams} params
 * @param {Iterable<string>} urls
 * @return {Map<string, number>} Map of URL keys to latest visit timestamps.
 */
export async function mapUrlsToVisits({ endDate, startDate }, urls) {
    const latestVisits = new Map()

    await db.visits
        .where('url')
        .anyOf(urls)
        .eachPrimaryKey(([time, url]) => {
            // Only record if within time filter bounds
            if (
                (endDate != null && time > endDate) ||
                (startDate != null && time < startDate)
            ) {
                return
            }
            latestVisits.set(url, time)
        })

    return latestVisits
}

/**
 * Goes through visits index from `endDate` until it groups enough URLs.
 * Space: O(skip + limit) - constant
 * Time: depends on how much visits per page; should be around log N as it's a range lookup
 *
 * @param {SearchParams} params
 * @param {Set<string>} [filteredURLs] Filtered URL whitelist to only include (opt.).
 * @return {Map<string, number> | null} Map of URL keys to latest visit time numbers. Should be size <= skip + limit.
 */
export async function groupLatestVisitsByUrl(
    { startDate = 0, endDate = Date.now(), skip = 0, limit = 10 },
    filteredUrls,
) {
    const latestVisitsByUrl = new Map()
    const shouldRecord = url =>
        !latestVisitsByUrl.has(url) && filteredUrls != null
            ? filteredUrls.has(url)
            : true

    // For all visits between startDate and endDate
    await db.visits
        .where('[time+url]')
        .between([startDate, Storage.MIN_STR], [endDate, Storage.MAX_STR])
        // Go through visits by most recent
        .reverse()
        // Stop iterating once we have enough
        .until(() => latestVisitsByUrl.size > skip + limit)
        // For each visit PK, reduce down into Map of URL keys to latest visit time
        .eachPrimaryKey(([time, url]) => {
            // Only ever record the latest visit for each URL (first due to IndexedDB keys ordering)
            if (shouldRecord(url)) {
                latestVisitsByUrl.set(url, time)
            }
        })

    return latestVisitsByUrl
}
