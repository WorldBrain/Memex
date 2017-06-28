import uniqBy from 'lodash/fp/uniqBy'

/**
 * @typedef IBlacklistOldExt
 * @type {Object}
 * @property {Array<String>} PAGE An array of blocked pages (UNUSED).
 * @property {Array<String>} SITE An array of blocked sites (UNUSED).
 * @property {Array<String>} REGEX An array of strings to use to match sites.
 */

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
