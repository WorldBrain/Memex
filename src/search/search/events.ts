import { DBGet, SearchParams, PageResultsMap, FilteredIDs } from '..'
import { Bookmark } from '../models'
import { SearchLookbacksPlugin, DexieUtilsPlugin } from '../plugins'

/**
 * Given some URLs, grab the latest assoc. event timestamp for each one within the time filter bounds.
 */
export const mapUrlsToLatestEvents = (getDb: DBGet) => async (
    { endDate, startDate, bookmarks }: Partial<SearchParams>,
    urls: string[],
) => {
    const db = await getDb()

    /**
     * @param {PageResultsMap} urlTimeMap Map to keep track of URL-timestamp pairs.
     * @param {boolean} [skipDateCheck=false] Flag to denote whether to skip start/end date boundary checking.
     * @returns A function that looks at each URL-timestamp pair and decides if should keep track or not.
     */
    function attemptAdd(urlTimeMap: PageResultsMap, skipDateCheck = false) {
        return (time: number, url: string) => {
            const existing = urlTimeMap.get(url) || 0

            if (
                existing > time ||
                (!skipDateCheck && endDate != null && endDate < time) ||
                (!skipDateCheck && startDate != null && startDate > time)
            ) {
                return false
            }

            urlTimeMap.set(url, time)
            return true
        }
    }

    const latestBookmarks: PageResultsMap = new Map()
    const bms = await db
        .collection('bookmarks')
        .findObjects<Bookmark>({ url: { $in: urls } })

    bms.forEach(({ time, url }) =>
        attemptAdd(latestBookmarks, bookmarks)(time, url),
    )

    const latestVisits: PageResultsMap = new Map()
    const urlsToCheck = bookmarks ? [...latestBookmarks.keys()] : urls
    // Simple state to keep track of when to finish each query
    const doneFlags = urlsToCheck.map(url => false)

    const visits = await db.operation(DexieUtilsPlugin.GET_PKS_OP, {
        collection: 'visits',
        fieldName: 'url',
        opName: 'anyOf',
        opValue: urlsToCheck,
        reverse: true,
    })

    const visitsPerPage = new Map<string, number[]>()
    visits.forEach(([time, url]) => {
        const current = visitsPerPage.get(url) || []
        visitsPerPage.set(url, [...current, time])
    })

    urlsToCheck.forEach((url, i) => {
        const currVisits = visitsPerPage.get(url) || []
        // `currVisits` array assumed sorted latest first
        currVisits.forEach(visit => {
            if (doneFlags[i]) {
                return
            }

            doneFlags[i] = attemptAdd(latestVisits)(visit, url)
        })
    })

    // Merge results
    const latestEvents: PageResultsMap = new Map()
    latestVisits.forEach(attemptAdd(latestEvents))
    latestBookmarks.forEach(attemptAdd(latestEvents))

    return latestEvents
}

/**
 * @return Map of URL keys to latest visit time numbers. Should be size <= skip + limit.
 */
export const groupLatestEventsByUrl = (getDb: DBGet) => async (
    params: Partial<SearchParams>,
    filteredUrls: FilteredIDs,
) => {
    const db = await getDb()
    return params.bookmarks
        ? db.operation(SearchLookbacksPlugin.BM_TIME_OP_ID, params)
        : db.operation(
              SearchLookbacksPlugin.FROM_END_DATE_OP_ID,
              params,
              filteredUrls,
          )
}
