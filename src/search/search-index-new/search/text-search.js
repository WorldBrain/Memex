import db from '..'

/**
 * Performs a query for a single term on a given multi-index.
 *
 * @param {string} term
 * @param {string} index
 * @return {Promise<string[]>} Resolves to Array of unique URL keys of matched Pages.
 */
const termQuery = (term, index) =>
    db.pages
        .where(index)
        .equals(term)
        .primaryKeys()

/**
 * For a given term, run all index lookups at the same time. Return when done.
 *
 * @param {string} term
 */
async function lookupTerm(term) {
    const [content, title, url] = await Promise.all([
        termQuery(term, 'terms'),
        termQuery(term, 'titleTerms'),
        termQuery(term, 'urlTerms'),
    ])

    return { content, title, url }
}

const scoreTermResults = filteredUrls =>
    function({ content, title, url }) {
        const urlScoreMap = new Map()

        const add = multiplier => url => {
            const existing = urlScoreMap.get(url)
            if (
                filteredUrls != null
                    ? filteredUrls.has(url)
                    : true && (!existing || existing < multiplier)
            ) {
                urlScoreMap.set(url, multiplier)
            }
        }

        // For each index's matched URLs add them to the Map, but only if they're higher than
        //  the existing entry, or nothing exists for given URL yet
        content.forEach(add(1))
        url.forEach(add(1.1))
        title.forEach(add(1.2))
        return urlScoreMap
    }

const intersectTermResults = (a, b) =>
    new Map([...a].filter(([url]) => b.has(url)))

/**
* @param {SearchParams} params
* @param {Set<string> | null} filteredUrls Opt. white-list of URLs to only include.
* @return {Promise<Map<string, number>>} Map of found URL keys to score multipliers, depending on what index term found in.
*/
export async function textSearch({ queryTerms }, filteredUrls) {
    // For each term create an object of with props of matched URL arrays for each index: content, title, and url
    const termResults = await Promise.all(queryTerms.map(lookupTerm))

    // Creates a Map of URLs to score multipliers, based on if they were found in title, URL, or content terms,
    //  These are intersected between results for separate words
    return termResults
        .map(scoreTermResults(filteredUrls))
        .reduce(intersectTermResults)
}
