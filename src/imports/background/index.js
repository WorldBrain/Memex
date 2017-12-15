import importsConnectionHandler from './import-connection-handler'
import { OLD_EXT_KEYS } from 'src/options/imports/constants'

// Constants
export const importStateStorageKey = 'import_items'
export const installTimeStorageKey = 'extension_install_time'

/**
 * Removes local storage entry representing single page data in the old ext.
 *
 * @param {string} oldExtKey Local storage key to remove.
 */
export async function clearOldExtData({ timestamp, index }) {
    const {
        [OLD_EXT_KEYS.INDEX]: oldIndex,
        [OLD_EXT_KEYS.NUM_DONE]: numDone,
    } = await browser.storage.local.get({
        [OLD_EXT_KEYS.INDEX]: { index: [] },
        [OLD_EXT_KEYS.NUM_DONE]: 0,
    })

    // Inc. finished count
    await browser.storage.local.set({
        [OLD_EXT_KEYS.NUM_DONE]: numDone + 1,
        [OLD_EXT_KEYS.INDEX]: {
            index: [
                ...oldIndex.index.slice(0, index),
                ...oldIndex.index.slice(index + 1),
            ],
        },
    })
    // Remove old ext page item
    await browser.storage.local.remove(timestamp.toString())
}

// Allow content-script or UI to connect and communicate control of imports
browser.runtime.onConnect.addListener(importsConnectionHandler)
