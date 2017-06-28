import uniqBy from 'lodash/fp/uniqBy'

import { generatePageDocId } from 'src/page-storage'

/**
 * @typedef IBlacklistOldExt
 * @type {Object}
 * @property {Array<String>} PAGE An array of blocked pages (UNUSED).
 * @property {Array<String>} SITE An array of blocked sites (UNUSED).
 * @property {Array<String>} REGEX An array of strings to use to match sites.
 */

/**
 * @typedef IPageOldExt
 * @type {Object}
 * @property {String} text The extracted page text.
 * @property {String} time The time the page data was stored.
 * @property {String} title The page title.
 * @property {String} url The URL pointing to the page.
 */

/**
 * @param {IPageOldExt} oldPage
 * @return {IPageDoc} The converted minimal page doc.
 */
const transformPageEntry = isStub => ({ text, time, title, url }) => ({
    _id: generatePageDocId({ timestamp: time }),
    title,
    url,
    isStub,
    content: {
        fullText: text,
        title,
    },
})

const transformBlacklistEntry = dateAdded => expression => ({ expression, dateAdded })

/**
 * @param {IBlacklistOldExt} blacklist The old extension-formatted blacklist.
 * @return {String} The new extension serialized array of `{ expression: String, dateAdded: Date }` elements.
 */
export function convertBlacklist(blacklist) {
    const mapToNewModel = transformBlacklistEntry(Date.now())
    const uniqByExpression = uniqBy('expression')

    // Map all old values to enries in new model; uniq them on 'expression'
    const blacklistArr = uniqByExpression([
        ...blacklist.PAGE.map(mapToNewModel),
        ...blacklist.SITE.map(mapToNewModel),
        ...blacklist.REGEX.map(mapToNewModel),
    ])

    return JSON.stringify(blacklistArr) // Serialize it, as stored in new model
}

/**
 * @param {Array<IPageOldExt>} oldPage Array of old model pages to convert.
 * @param {boolean} [setAsStubs=false] Flag denoting whether or not to note the converted docs as stubs
 *  (to schedule for imports).
 * @return {Array<IPageDoc} Array of converted minimal page docs.
 */
export function convertPages(oldPages, setAsStubs = false) {
    return oldPages.map(transformPageEntry(setAsStubs))
}
