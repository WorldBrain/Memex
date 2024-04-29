import browser from 'webextension-polyfill'
import { BULK_SELECT_STORAGE_KEY } from './constants'
import type { BulkEditCollection, BulkEditItem } from './types'

// write a function that gets browser.local.storage.set and browser.local.storage.get to write to a storage entry called "bulkEdit"

export async function setBulkEdit(
    data: BulkEditCollection,
    shouldRemove: boolean,
) {
    const bulkEditStorage: BulkEditCollection = (await getBulkEditItems()) ?? {}
    let dataToWrite = bulkEditStorage

    // Iterate over the entries of the data object
    for (const [url, item] of Object.entries(data)) {
        if (!shouldRemove) {
            dataToWrite[url] = item
        } else {
            delete dataToWrite[url]
        }
    }

    await browser.storage.local.set({ [BULK_SELECT_STORAGE_KEY]: dataToWrite })
}

export async function getBulkEditItems(): Promise<BulkEditCollection> {
    const data = await browser.storage.local.get(BULK_SELECT_STORAGE_KEY)
    const currentData: BulkEditCollection = data[BULK_SELECT_STORAGE_KEY]

    return currentData ? currentData : {}
}
export async function clearBulkEditItems() {
    await browser.storage.local.remove(BULK_SELECT_STORAGE_KEY)
}
