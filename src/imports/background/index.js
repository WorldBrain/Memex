import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import ConnHandler from './import-connection-handler'
import importEstManager from './import-estimates'
import { OLD_EXT_KEYS, IMPORT_CONN_NAME } from 'src/options/imports/constants'

// Constants
export const importStateStorageKey = 'import_items'
export const installTimeStorageKey = 'extension_install_time'

// Allow UI scripts to dirty estimates cache
makeRemotelyCallable({ dirtyEstsCache: () => importEstManager.dirty() })

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
browser.runtime.onConnect.addListener(port => {
    // Make sure to only handle connection logic for imports (allows other use of runtime.connect)
    if (port.name !== IMPORT_CONN_NAME) return

    console.log('importer connected')

    return new ConnHandler(port)
})
