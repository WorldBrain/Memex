import uniqBy from 'lodash/fp/uniqBy'

import { STORAGE_KEY } from 'src/options/blacklist/constants'
import * as constants from './constants'

/**
 * @typedef IBlacklistOldExt
 * @type {Object}
 * @property {Array<String>} PAGE An array of blocked pages (UNUSED).
 * @property {Array<String>} SITE An array of blocked sites (UNUSED).
 * @property {Array<String>} REGEX An array of strings to use to match sites.
 */

const transformToBlacklistEntry = dateAdded => expression => ({
    expression,
    dateAdded,
})

/**
 * @param {IBlacklistOldExt} blacklist The old extension-formatted blacklist.
 * @return {String} The new extension serialized array of `{ expression: String, dateAdded: Date }` elements.
 */
function convertBlacklist(blacklist) {
    const mapToNewModel = transformToBlacklistEntry(Date.now())
    const uniqByExpression = uniqBy('expression')

    // Map all old values to enries in new model; uniq them on 'expression'
    const blacklistArr = uniqByExpression([
        ...blacklist.PAGE.map(mapToNewModel),
        ...blacklist.SITE.map(mapToNewModel),
        ...blacklist.REGEX.map(mapToNewModel),
        ...constants.DEF_ENTRIES.map(mapToNewModel),
    ])

    return JSON.stringify(blacklistArr) // Serialize it, as stored in new model
}

export default async function convertOldBlacklist() {
    const { [STORAGE_KEY]: blacklist } = await browser.storage.local.get({
        [STORAGE_KEY]: { PAGE: [], SITE: [], REGEX: [] },
    })

    // Only attempt blacklist conversion if it matches shape of old extension blacklist
    if (
        Object.prototype.toString.call(blacklist) === '[object Object]' &&
        'PAGE' in blacklist &&
        'SITE' in blacklist &&
        'REGEX' in blacklist
    ) {
        const newBlacklist = await convertBlacklist(blacklist)
        await browser.storage.local.set({
            [STORAGE_KEY]: newBlacklist,
            [constants.CONVERT_TIME_KEY]: Date.now(),
        })

        // Remove misc. unused old ext data from local storage
        await browser.storage.local.remove(constants.OLD_EXT_MISC_KEYS)
    }
}
