import { STORAGE_KEY } from 'src/options/blacklist/constants'

/**
 * Default blacklist entries.
 */
export const defaultEntries = [
    'http://localhost',
    'https://localhost',
    'google.com/maps',
]

/**
 * Given a URL and user's blacklist, checks the URL against the blacklist expressions to see if any
 * rule matches it.
 *
 * @param {string} url The URL to check against the blacklist.
 * @param {Array<any>} blacklist Blacklist data to check URL against.
 * @return {boolean} Denotes whether or not the given URL matches any blacklist expressions.
 */
export function isURLBlacklisted(url = '', blacklist = []) {
    // Main checking logic between a given blacklist expression and current URL
    //   TODO: make this more "smart" (maybe check parts of the URL instead of match all, for e.g.)
    const doesExpressionMatchURL = (expression = '') => url.includes(expression)

    // Reduces blacklist to a bool by running main checking logic against each blacklist expression
    // (returns true if a single match is found in entire blacklist)
    return blacklist.reduce(
        (prev, curr) => doesExpressionMatchURL(curr.expression) || prev,
        false,
    )
}

/**
 * HOF which wraps a blacklist checking function up with stored blacklist data.
 * @returns {({ url: string }) => boolean} Ready-to-use checking function against a URL
 */
export async function checkWithBlacklist() {
    const blacklist = await fetchBlacklist()

    /**
     * @param {string} url The URL to check against the blacklist
     */
    return ({ url = '' } = {}) => !isURLBlacklisted(url, blacklist)
}

/**
 * Fetches ready-to-use blacklist array from storage.
 * @returns {Array<any>} Blacklist represented by nn array of objects containing `expression` keys
 */
export async function fetchBlacklist() {
    // Fetch and parse blacklist data for check calls to use
    const { blacklist } = await browser.storage.local.get(STORAGE_KEY)

    return !blacklist ? [] : JSON.parse(blacklist)
}

async function storeBlacklist(blacklist = []) {
    const serialized = JSON.stringify(blacklist)

    return browser.storage.local.set({ [STORAGE_KEY]: serialized })
}

const createBlacklistEntry = url => ({
    expression: url,
    dateAdded: Date.now(),
})

/**
 * @param {string[]|string} url Array of or single URL string to add to blacklist.
 */
export async function addToBlacklist(url) {
    const blacklist = await fetchBlacklist()
    const newBlacklist =
        url instanceof Array
            ? url.map(createBlacklistEntry)
            : [createBlacklistEntry(url)]

    return storeBlacklist([...blacklist, ...newBlacklist])
}
