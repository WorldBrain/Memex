import { browser } from 'webextension-polyfill-ts'
import { BULK_SELECT_STORAGE_KEY } from './constants'
import type { BulkEditItem } from './types'

// write a function that gets browser.local.storage.set and browser.local.storage.get to write to a storage entry called "bulkEdit"

export async function setBulkEdit(data: any, shouldRemove: boolean) {
    const bulkEditStorage = (await getBulkEditItems()) ?? []
    let dataToWrite = bulkEditStorage

    for (const item of data) {
        if (!shouldRemove) {
            if (!dataToWrite.some((element) => element.url === item.url)) {
                dataToWrite.unshift(item)
            }
        } else {
            dataToWrite = dataToWrite.filter(
                (element) => element.url !== item.url,
            )
        }
    }

    await browser.storage.local.set({ [BULK_SELECT_STORAGE_KEY]: dataToWrite })
}

export async function getBulkEditItems(): Promise<BulkEditItem[]> {
    const data = await browser.storage.local.get(BULK_SELECT_STORAGE_KEY)
    const currentData = data[BULK_SELECT_STORAGE_KEY]

    return currentData ? currentData : []
}
export async function clearBulkEditItems() {
    await browser.storage.local.remove(BULK_SELECT_STORAGE_KEY)
}

export async function deleteBulkEdit(pageDeletionFunction) {
    let currentBulkItems = await browser.storage.local.get(
        BULK_SELECT_STORAGE_KEY,
    )

    for (const item of currentBulkItems[BULK_SELECT_STORAGE_KEY]) {
        if (item.type === 'note') {
        }

        if (item.type === 'page') {
            await pageDeletionFunction({ pageId: item.url })
        }
    }

    await browser.storage.local.remove(BULK_SELECT_STORAGE_KEY)
}
