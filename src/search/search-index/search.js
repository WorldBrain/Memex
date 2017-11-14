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
        (query.query.size || query.domain.size)
    ) {
        return null
    }

    if (!query.query.size && !query.domain.size) {
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
 * @param {IndexQuery} query
 * @returns {Map<string, IndexTermValue>}
 */
async function termSearch({ query, bookmarksFilter }) {
    // Exit early for wildcard
    if (!query.size) {
        return null
    }

    // For each term, do index lookup to grab the associated page IDs value
    const termValuesMap = await lookupByKeys([...query].map(keyGen.term))

    // If any terms are empty, they cancel all other results out
    if (containsEmptyVals(termValuesMap.values())) {
        return new Map()
    }

    // Union the nested 'pageId => weights' Maps for each term
    let pageValuesMap = unionNestedMaps(termValuesMap)

    // Perform intersect of Map on each term value key to AND results
    if (termValuesMap.size > 1) {
        pageValuesMap = intersectManyMaps([...termValuesMap.values()])
    }

    // Merge in boosted docs for other fields
    const pageResultsMap = new Map([
        ...pageValuesMap,
        ...(await boostedUrlSearch({ query }, pageValuesMap)),
        ...(await boostedTitleSearch({ query }, pageValuesMap)),
    ])

    return bookmarksFilter
        ? filterResultsByBookmarks(pageResultsMap)
        : pageResultsMap
}

/**
 * @param {(term: string) => string} keyMapFn
 * @param {number} boost
 * @returns {(IndexQuery, Map<string, IndexTermValue>) => Map<string, IndexTermValue>}
 */
const boostedTermSearch = (keyGenFn, boost) => async (
    { query },
    baseResults,
) => {
    // For each term, do index lookup to grab the associated page IDs value
    const titleTermValuesMap = await lookupByKeys([...query].map(keyGenFn))

    const pageScoresMap = boostScores(titleTermValuesMap, boost)

    // Filter out page scores that don't appear in the base results
    return new Map(
        [...pageScoresMap].filter(([pageId]) => baseResults.has(pageId)),
    )
}

const boostedTitleSearch = boostedTermSearch(keyGen.title, 0.2)
const boostedUrlSearch = boostedTermSearch(keyGen.url, 0.1)

function formatIdResults(pageResultsMap) {
    const results = []

    for (const [pageId, value] of pageResultsMap) {
        results.push(structureSearchResult({ id: pageId }, value.latest))
    }

    return results
}

async function resolveIdResults(pageResultsMap) {
    const pageValuesMap = await lookupByKeys([...pageResultsMap.keys()])

    const results = []

    for (const [pageId, props] of pageValuesMap) {
        const { latest } = pageResultsMap.get(pageId)
        results.push(structureSearchResult(props, latest))
    }

    return results
}

/**
 * @param {Map<string, IndexTermValue>} [termPages]
 * @param {Map<string, IndexTermValue>} [filterPages]
 * @param {Map<string, IndexTermValue>} [domainPages]
 * @returns {Map<string, IndexTermValue>} Interescted results of all four
 */
function intersectResultMaps(termPages, filterPages, domainPages) {
    if (filterPages == null && termPages == null) {
        return domainPages
    }

    const intersectDomain = intersectMaps(domainPages)

    // Should be null if filter search not needed to be run
    if (filterPages == null) {
        return domainPages == null ? termPages : intersectDomain(termPages)
    }

    if (termPages == null) {
        return domainPages == null ? filterPages : intersectDomain(filterPages)
    }

    // Filter out only results in the domain, if domain search is on
    if (domainPages != null) {
        filterPages = intersectDomain(filterPages)
        termPages = intersectDomain(termPages)
        return intersectMaps(filterPages)(termPages)
    }

    return intersectMaps(filterPages)(termPages)
}

/**
 * Performs a search based on data supplied in the `query`.
 *
 * @param {IndexQuery} query
 * @param {boolean} [fullDocs=true] Specifies whether to return just the ID or all doc data.
 * @returns {SearchResult[]}
 */
export async function search(
    query = { skip: 0, limit: 10 },
    { fullDocs = true, count = false } = { fullDocs: true, count: false },
) {
    const paginateResults = paginate(query)
    let totalResultCount
    console.time('total search')

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
    )

    if (count) {
        totalResultCount = pageResultsMap.size
    }

    // Either or resolve result IDs to their indexed doc data, or just return the IDs map
    const results = fullDocs
        ? await resolveIdResults(pageResultsMap)
        : formatIdResults(pageResultsMap)

    console.timeEnd('total search')
    return {
        results: paginateResults(results),
        totalCount: totalResultCount,
    }
}

export const searchConcurrent = (...req) =>
    new Promise((resolve, reject) =>
        indexQueue.push(() =>
            search(...req)
                .then(resolve)
                .catch(reject),
        ),
    )
