import {
    containsEmptyVals,
    intersectMaps,
    intersectManyMaps,
    unionNestedMaps,
} from 'src/util/map-set-helpers'
import {
    boostScores,
    structureSearchResult,
    initLookupByKeys,
    keyGen,
    rangeLookup,
    reverseRangeLookup,
    removeKeyType,
} from './util'
import { indexQueue } from '.'

const lookupByKeys = initLookupByKeys()

const compareByScore = (a, b) => b.score - a.score

// TODO: If only the page state changes, re-use results from last search
const paginate = ({ skip, limit }) => results =>
    results.sort(compareByScore).slice(skip, skip + limit)

const filterSearch = query => {
    // Exit early for no values
    if (
        query.timeFilter.get('blank') &&
        (query.query.size || query.domain.size || query.tags.size)
    ) {
        return null
    }

    if (!query.query.size && !query.domain.size && !query.tags.size) {
        return timeFilterBackSearch(query)
    }
    return timeFilterSearch(query)
}

/**
 * Quicker version of time filter search that can be run when no terms defined.
 * Simply searches backwards from the key specified in `timeFilter` until the
 * latest `limit + skip` pages have been collected.
 *
 * @param {IndexQuery}
 * @returns {Map<string, IndexTermValue>}
 */
async function timeFilterBackSearch({
    timeFilter,
    limit,
    skip,
    bookmarksFilter,
}) {
    // Back search bookmarks in all cases
    const data = [
        await reverseRangeLookup({
            ...timeFilter.get('bookmark/'),
            limit: skip + limit,
        }),
    ]

    // Add result of visit back search if bookmarks flag not set
    if (!bookmarksFilter) {
        // Lookup for all time filters for non-bookmark search
        data.push(
            await reverseRangeLookup({
                ...timeFilter.get('visit/'),
                limit: skip + limit,
            }),
        )
    }

    return new Map([...data.reduce((acc, curr) => [...acc, ...curr], [])])
}

/**
 * Linear version of time filter search. Searches entire space in given
 * `timeFilter` range. Needs to be used with term search, so the intersection
 * step can be done against all possible time filter values.
 * TODO: make to be run incrementally to reduce average case search space.
 *
 * @param {IndexQuery}
 * @returns {Map<string, IndexTermValue>}
 */
async function timeFilterSearch({ timeFilter, bookmarksFilter }) {
    const timeRange = timeFilter.get(bookmarksFilter ? 'bookmark/' : 'visit/')
    const data = [await rangeLookup(timeRange)]

    // Perform union of results between all filter types (for now)
    const unionedResults = new Map([
        ...data.reduce((acc, curr) => [...acc, ...curr], []),
    ])

    //  Create a Map of page ID keys to their weights
    return new Map(
        [...unionedResults].reduce(
            (acc, [timeKey, pageId]) => [
                ...acc,
                [pageId, { latest: removeKeyType(timeKey) }],
            ],
            [],
        ),
    )
}

async function filterResultsByBookmarks(pageResultsMap) {
    const pageLookupDocs = await lookupByKeys([...pageResultsMap.keys()])

    return new Map(
        [...pageResultsMap].filter(
            ([pageKey, lookupDoc]) =>
                pageLookupDocs.get(pageKey).bookmarks.size,
        ),
    )
}

/**
 * @param {IndexQuery} query
 * @returns {Map<string, IndexTermValue>}
 */
async function tagsSearch({ tags, bookmarksFilter }) {
    if (!tags.size) {
        return null
    }

    const tagsValuesMap = await lookupByKeys([...tags].map(keyGen.tag))

    // If any tags are empty, they cancel all other results out
    if (containsEmptyVals(tagsValuesMap.values())) {
        return new Map()
    }

    // Union the nested `pageId => scores` Maps for each tag
    const pageResultsMap = unionNestedMaps(tagsValuesMap)

    return bookmarksFilter
        ? filterResultsByBookmarks(pageResultsMap)
        : pageResultsMap
}

/**
 * @param {IndexQuery} query
 * @returns {Map<string, IndexTermValue>}
 */
async function domainSearch({ domain, bookmarksFilter }) {
    if (!domain.size) {
        return null
    }

    const domainValuesMap = await lookupByKeys([...domain].map(keyGen.domain))

    // If any domains are empty, they cancel all other results out
    if (containsEmptyVals(domainValuesMap.values())) {
        return new Map()
    }

    // Union the nested 'pageId => scores' Maps for each domain
    const pageResultsMap = unionNestedMaps(domainValuesMap)

    return bookmarksFilter
        ? filterResultsByBookmarks(pageResultsMap)
        : pageResultsMap
}

/**
 * @param {(term: string) => string} keyMapFn
 * @param {number} [boost]
 * @returns {(q: IndexQuery) => Promise<Map<string, IndexTermValue>>}
 */
const initTermSearch = (keyGenFn, boost) => async ({ query }) => {
    // For each term, do index lookup to grab the associated page IDs value
    const termValuesMap = await lookupByKeys([...query].map(keyGenFn))

    // If the terms are all indexed, union the nested 'pageId => weights' Maps for each term (clean up the structure),
    //  however if any of the terms searched are not indexed, don't use terms results
    let pageValuesMap = !containsEmptyVals(termValuesMap.values())
        ? unionNestedMaps(termValuesMap)
        : new Map()

    // Perform intersect of Map on each term value key to AND results
    if (pageValuesMap.size > 1) {
        pageValuesMap = intersectManyMaps([...termValuesMap.values()])
    }

    return boostScores(pageValuesMap, boost)
}

const baseTermSearch = initTermSearch(keyGen.term)
const boostedTitleSearch = initTermSearch(keyGen.title, 0.2)
const boostedUrlSearch = initTermSearch(keyGen.url, 0.1)

/**
 * @param {IndexQuery} query
 * @returns {Map<string, IndexTermValue>}
 */
async function termSearch({ bookmarksFilter, ...query }) {
    // Exit early for wildcard
    if (!query.query.size) {
        return null
    }

    // Perform terms search on each index
    const [content, title, url] = await Promise.all([
        baseTermSearch(query),
        boostedTitleSearch(query),
        boostedUrlSearch(query),
    ])

    const pageResultsMap = new Map([...content, ...title, ...url])

    return bookmarksFilter
        ? filterResultsByBookmarks(pageResultsMap)
        : pageResultsMap
}

/**
 * Takes in final search results (should be page size) and performs the reverse index lookup
 * for each of them, augmenting their `document` property with the contents.
 * @param {SearchResult[]} results
 * @returns {SearchResult[]}
 */
async function fillOutResultDocs(results) {
    // Do reverse index lookup
    const pageIds = results.map(result => result.id)
    const reverseDocsMap = await lookupByKeys(pageIds)

    // Augment results with full reverse index docs
    return results.map(result => ({
        ...result,
        document: reverseDocsMap.get(result.id),
    }))
}

/**
 * TODO: this won't scale to many different search params; find cleaner way to do conditional result intersection.
 *
 * @param {Map<string, IndexTermValue>} [termPages]
 * @param {Map<string, IndexTermValue>} [timeFilterPages]
 * @param {Map<string, IndexTermValue>} [domainPages]
 * @param {Map<string, IndexTermValue>} [tagPages]
 * @returns {Map<string, IndexTermValue>} Interescted results of all four
 */
function intersectResultMaps(
    termPages,
    timeFilterPages,
    domainPages,
    tagPages,
) {
    // Base cases where terms/time-filter not present
    if (timeFilterPages == null && termPages == null) {
        if (domainPages == null) {
            return tagPages
        }

        if (tagPages == null) {
            return domainPages
        }

        return intersectMaps(domainPages)(tagPages)
    }

    // Filter terms/time-filter by domain results, if present
    if (domainPages != null) {
        const intersectDomain = intersectMaps(domainPages)
        termPages = termPages == null ? termPages : intersectDomain(termPages)
        timeFilterPages =
            timeFilterPages == null
                ? timeFilterPages
                : intersectDomain(timeFilterPages)
    }

    // Filter terms/time-filter by tag results, if present
    if (tagPages != null) {
        const intersectTags = intersectMaps(tagPages)
        termPages = termPages == null ? termPages : intersectTags(termPages)
        timeFilterPages =
            timeFilterPages == null
                ? timeFilterPages
                : intersectTags(timeFilterPages)
    }

    // Should be null if time filter not used
    if (timeFilterPages == null) {
        return termPages
    }

    // Should be null if no terms queried
    if (termPages == null) {
        return timeFilterPages
    }

    // If both defined, return intersection
    return intersectMaps(timeFilterPages)(termPages)
}

/**
 * Performs a search based on data supplied in the `query`.
 *
 * @param {IndexQuery} query
 * @param {boolean} [count=false] Specifies whether to return the `totalCount` of results for query.
 * @returns {SearchResult[]}
 */
export async function search(
    query = { skip: 0, limit: 10 },
    { count = false } = { count: false },
) {
    const paginateResults = paginate(query)
    let totalResultCount
    console.time('total search')

    console.time('tags search')
    const tagsPageResultsMap = await tagsSearch(query)
    console.timeEnd('tags search')

    console.time('domain search')
    const domainPageResultsMap = await domainSearch(query)
    console.timeEnd('domain search')

    console.time('term search')
    const termPageResultsMap = await termSearch(query)
    console.timeEnd('term search')

    console.time('filter search')
    const filterPageResultsMap = await filterSearch(query)
    console.timeEnd('filter search')

    // Intersect different kinds of results
    const pageResultsMap = intersectResultMaps(
        termPageResultsMap,
        filterPageResultsMap,
        domainPageResultsMap,
        tagsPageResultsMap,
    )

    if (count) {
        totalResultCount = pageResultsMap.size
    }

    // Structure all results as `SearchResult`s (minimal `document`)
    let results = [...pageResultsMap].map(([id, { latest }]) =>
        structureSearchResult({ id }, latest),
    )

    results = paginateResults(results)
    results = await fillOutResultDocs(results)
    console.timeEnd('total search')

    return {
        results,
        totalCount: totalResultCount,
    }
}

export const searchConcurrent = (...req) =>
    new Promise((resolve, reject) =>
        indexQueue.pushPriority(() =>
            search(...req)
                .then(resolve)
                .catch(reject),
        ),
    )
