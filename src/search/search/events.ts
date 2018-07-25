import db, { Storage, SearchParams, PageResultsMap, FilteredURLs } from '..'

/**
 * Given some URLs, grab the latest assoc. event timestamp for each one within the time filter bounds.
 */
export async function mapUrlsToLatestEvents(
    { endDate, startDate, bookmarks }: Partial<SearchParams>,
    urls: string[],
) {
    const latestEvents = new Map()

    const attemptAdd = ({ time, url }) => {
        const existing = latestEvents.get(url) || 0
        if (
            existing > time ||
            (endDate != null && time > endDate) ||
            (startDate != null && time < startDate)
        ) {
            return false
        }

        latestEvents.set(url, time)
        return true
    }

    // Previously used `.anyOf()` + `.eachPrimaryKey()` in a single query
    //  Turns out it's _way_ faster to do multiple parrallel queries for this
    //  (URLs are not unique in visits index)
    if (!bookmarks) {
        // Simple state to keep track of when to finish each query
        const doneFlags = urls.map(url => false)
        await Promise.all(
            urls.map((currUrl, i) =>
                db.visits
                    .where('url')
                    .equals(currUrl)
                    .reverse()
                    // Mark of current query as done as soon as visit passes adding criteria
                    .until(() => doneFlags[i])
                    .eachPrimaryKey(
                        ([time, url]) =>
                            (doneFlags[i] = attemptAdd({ time, url })),
                    ),
            ),
        )
    }

    await db.bookmarks
        .where('url')
        .anyOf(urls)
        .each(attemptAdd)

    return latestEvents
}

/**
 * Goes through visits and bookmarks index from `endDate` until it groups enough URLs.
 * The `.until` in the query chain forces time and space to be constant to `skip + limit`
 *
 * @return Map of URL keys to latest visit time numbers. Should be size <= skip + limit.
 */
export async function groupLatestEventsByUrl(
    {
        startDate = 0,
        endDate = Date.now(),
        skip = 0,
        limit = 10,
        bookmarks,
    }: Partial<SearchParams>,
    filteredUrls: FilteredURLs,
): Promise<PageResultsMap> {
    // Lookback from endDate to get needed amount of visits
    const latestVisits: PageResultsMap = new Map()
    if (!bookmarks) {
        await db.visits
            .where('[time+url]')
            .between(
                [startDate, Storage.MIN_STR],
                [endDate, Storage.MAX_STR],
                true,
                true,
            )
            // Go through visits by most recent
            .reverse()
            // Stop iterating once we have enough
            .until(() => latestVisits.size >= skip + limit)
            // For each visit PK, reduce down into Map of URL keys to latest visit time
            .eachPrimaryKey(([time, url]) => {
                // Only ever record the latest visit for each URL (first due to IndexedDB reverse keys ordering)
                if (!latestVisits.has(url) && filteredUrls.isAllowed(url)) {
                    latestVisits.set(url, time)
                }
            })
    }

    // Similar lookback on bookmarks
    const latestBookmarks: PageResultsMap = new Map()
    await db.bookmarks
        .where('time')
        .between(startDate, endDate, true, true)
        .reverse()
        .until(() => latestBookmarks.size >= skip + limit)
        .each(({ time, url }) => latestBookmarks.set(url, time))

    // Merge results
    const latestEvents: PageResultsMap = new Map()
    const addToMap = (time, url) => {
        const existing = latestEvents.get(url) || 0
        if (existing < time) {
            latestEvents.set(url, time)
        }
    }
    latestVisits.forEach(addToMap)
    latestBookmarks.forEach(addToMap)

    return latestEvents
}
