import db, {
    SearchParams,
    FilteredURLs,
    TermsIndexName,
    PageResultsMap,
} from '..'

const some = require('lodash/some')

export interface TermResults {
    content: string[]
    title: string[]
    url: string[]
}

/**
 * Performs a query for a single term on a given multi-index.
 */
const termQuery = (term: string, excluded: string[]) => (
    index: TermsIndexName,
) => {
    let coll = db.pages.where(index).equals(term)

    // Adding a `.filter/.and` clause to a collection means it needs to iterate through
    if (excluded.length) {
        coll = coll.filter(page => {
            const uniqueTerms = new Set([
                ...page.terms,
                ...page.titleTerms,
                ...page.urlTerms,
            ])

            return !some(excluded, t => uniqueTerms.has(t))
        })
    }

    return coll.primaryKeys()
}

/**
 * Performs a query for a single term on a all terms indexes.
 */
const lookupTerm = (excluded: string[]) =>
    async function(term: string): Promise<TermResults> {
        const queryIndex = termQuery(term, excluded)

        const [content, title, url] = await Promise.all([
            queryIndex('terms'),
            queryIndex('titleTerms'),
            queryIndex('urlTerms'),
        ])

        return { content, title, url }
    }

/**
 * Handles scoring results for a given term according to which index the results where found in.
 */
const scoreTermResults = (filteredUrls: FilteredURLs) =>
    function(result: TermResults): PageResultsMap {
        const urlScoreMap: PageResultsMap = new Map()

        const add = (multiplier: number) => (url: string) => {
            const existing = urlScoreMap.get(url)

            if (
                filteredUrls.isAllowed(url) &&
                (!existing || existing < multiplier)
            ) {
                urlScoreMap.set(url, multiplier)
            }
        }

        // For each index's matched URLs add them to the Map, but only if they're higher than
        //  the existing entry, or nothing exists for given URL yet
        result.content.forEach(add(1))
        result.url.forEach(add(1.1))
        result.title.forEach(add(1.2))
        return urlScoreMap
    }

const intersectTermResults = (a: PageResultsMap, b: PageResultsMap) =>
    new Map([...a].filter(([url]) => b.has(url)))

export async function textSearch(
    { terms, termsExclude }: Partial<SearchParams>,
    filteredUrls: FilteredURLs,
): Promise<PageResultsMap> {
    // For each term create an object of with props of matched URL arrays for each index: content, title, and url
    const termResults = await Promise.all(
        [...terms].map(lookupTerm(termsExclude)),
    )

    // Creates a Map of URLs to score multipliers, based on if they were found in title, URL, or content terms,
    //  These are intersected between results for separate words
    return termResults
        .map(scoreTermResults(filteredUrls))
        .reduce(intersectTermResults)
}
