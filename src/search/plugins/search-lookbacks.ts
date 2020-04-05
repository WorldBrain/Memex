import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

import { SearchParams, PageResultsMap, FilteredIDs } from '..'

export class SearchLookbacksPlugin extends StorageBackendPlugin<
    DexieStorageBackend
> {
    static FROM_END_DATE_OP_ID = 'memex:dexie.lookbackFromEndDate'
    static BM_TIME_OP_ID = 'memex:dexie.lookbackBookmarksTime'

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            SearchLookbacksPlugin.FROM_END_DATE_OP_ID,
            this.lookbackFromEndDate.bind(this),
        )
        backend.registerOperation(
            SearchLookbacksPlugin.BM_TIME_OP_ID,
            this.lookbackBookmarksTime.bind(this),
        )
    }

    /**
     * Goes through visits and bookmarks index from `endDate` until it groups enough URLs.
     * The `.until` in the query chain forces time and space to be constant to `skip + limit`
     */
    async lookbackFromEndDate(
        {
            startDate = 0,
            endDate = Date.now(),
            skip = 0,
            limit = 10,
        }: Partial<SearchParams>,
        filteredUrls: FilteredIDs,
    ) {
        const db = this.backend.dexieInstance
        // Lookback from endDate to get needed amount of visits
        const latestVisits: PageResultsMap = new Map()
        await db
            .table('visits')
            .where('[time+url]')
            .between(
                [startDate, ''],
                [endDate, String.fromCharCode(65535)],
                true,
                true,
            )
            // Go through visits by most recent
            .reverse()
            // Stop iterating once we have enough
            .until(() => latestVisits.size >= skip + limit)
            // For each visit PK, reduce down into Map of URL keys to latest visit time
            .eachPrimaryKey(key => {
                const [time, url] = key as [number, string]
                // Only ever record the latest visit for each URL (first due to IndexedDB reverse keys ordering)
                if (!latestVisits.has(url) && filteredUrls.isAllowed(url)) {
                    latestVisits.set(url, time)
                }
            })

        // Similar lookback on bookmarks
        const latestBookmarks: PageResultsMap = new Map()
        await db
            .table('bookmarks')
            .where('time')
            .between(startDate, endDate, true, true)
            .reverse()
            .until(() => latestBookmarks.size >= skip + limit)
            .each(({ time, url }) => latestBookmarks.set(url, time))

        // Merge results
        const results: PageResultsMap = new Map()
        const addToMap = (time, url) => {
            const existing = results.get(url) || 0
            if (existing < time) {
                results.set(url, time)
            }
        }
        latestVisits.forEach(addToMap)
        latestBookmarks.forEach(addToMap)

        return results
    }

    /**
     * Goes through bookmarks index from latest time until it groups enough URLs that have either been
     * bookmarked OR visited within the bounds specified in the search params.
     */
    async lookbackBookmarksTime({
        startDate = 0,
        endDate = Date.now(),
        skip = 0,
        limit = 10,
    }: Partial<SearchParams>) {
        const db = this.backend.dexieInstance
        let bmsExhausted = false
        let results: PageResultsMap = new Map()

        // Start looking back from latest time, then update upper bound to the latest result time each iteration
        let upperBound = Date.now()

        // Stop lookback when we have enough results or no more bookmarks
        while (results.size < skip + limit && !bmsExhausted) {
            const bms: PageResultsMap = new Map()

            // Grab latest page of bookmarks
            await db
                .table('bookmarks')
                .where('time')
                .belowOrEqual(upperBound)
                .reverse() // Latest first
                .until(() => bms.size >= skip + limit)
                .each(({ time, url }) => bms.set(url, time))

            if (bms.size < skip + limit) {
                bmsExhausted = true
            }

            // For each one, if was bookmarked later than endDate filter, replace with latest in-bounds visit
            await Promise.all(
                [...bms].map(async ([currentUrl, currentTime]) => {
                    if (currentTime > endDate || currentTime < startDate) {
                        let done = false
                        await db
                            .table('visits')
                            .where('url')
                            .equals(currentUrl)
                            .reverse()
                            .until(() => done)
                            .eachPrimaryKey(key => {
                                const [visitTime] = key as [number]
                                if (
                                    visitTime >= startDate &&
                                    visitTime <= endDate
                                ) {
                                    bms.set(currentUrl, visitTime)
                                    done = true
                                }
                            })
                    }
                }),
            )

            // Next iteration, look back from the oldest result's time (-1 to exclude the same result next time)
            upperBound = Math.min(...bms.values()) - 1

            // Add current iteration's bm results to result pool, filtering out any out-of-bounds bms
            results = new Map([
                ...results,
                ...[...bms].filter(
                    ([, time]) => time >= startDate && time <= endDate,
                ),
            ])
        }

        return results
    }
}
