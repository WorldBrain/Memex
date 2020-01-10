import { STORAGE_KEY } from 'src/options/blacklist/constants'
import getImportStateManager from 'src/imports/background/state-manager'

/**
 * Main checking logic between a given blacklist expression and current URL.
 */
function doesExpMatchURL(expression, url) {
    // Ensure special characters that can appear in URLs are escaped out before checking against the curr URL
    expression = expression.replace(/[()]/g, '\\$&')
    return new RegExp(expression, 'ig').test(url)
}

function checkBlacklist(url = '', blacklist = []) {
    for (const { expression } of blacklist) {
        if (doesExpMatchURL(expression, url)) {
            return true
        }
    }

    return false
}

/**
 * Given a URL and user's blacklist, checks the URL against the blacklist expressions to see if any
 * rule matches it.
 *
 * @param {string} url The URL to check against the blacklist.
 * @return {Promise<boolean>} Denotes whether or not the given URL matches any blacklist expressions.
 */
export async function isURLBlacklisted(url = '') {
    const blacklist = await fetchBlacklist()

    return checkBlacklist(url, blacklist)
}

/**
 * HOF which wraps a blacklist checking function up with stored blacklist data.
 * @returns {Promise<({ url: string }) => boolean>} Ready-to-use checking function against a URL
 */
export async function checkWithBlacklist() {
    const blacklist = await fetchBlacklist()

    /**
     * @param {string} url The URL to check against the blacklist
     * @returns {boolean} `true` if url in blacklist, else `false`
     */
    return ({ url = '' } = {}) => checkBlacklist(url, blacklist)
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
    await getImportStateManager().dirtyEstsCache()

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
    const newEntries =
        url instanceof Array
            ? url.map(createBlacklistEntry)
            : [createBlacklistEntry(url)]

    return storeBlacklist([...blacklist, ...newEntries])
}
