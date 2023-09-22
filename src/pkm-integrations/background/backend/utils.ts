import { browser } from 'webextension-polyfill-ts'

export async function shareAnnotationWithPKM(annotationData, pkmSyncBG) {
    let item = {
        type: 'annotation',
        data: annotationData,
    }

    await pkmSyncBG.pushPKMSyncUpdate(item)
}
export async function sharePageWithPKM(pageData, pkmSyncBG) {
    let item = {
        type: 'page',
        data: pageData,
    }

    await pkmSyncBG.pushPKMSyncUpdate(item)
}

export async function getPkmSyncKey() {
    // Check for pkmSyncKey in browser.storage.local
    let data = await browser.storage.local.get('PKMSYNCpkmSyncKey')
    let pkmSyncKey = data.PKMSYNCpkmSyncKey

    // If pkmSyncKey does not exist, create a new one and store it in local storage
    if (!pkmSyncKey) {
        // Generate a random string for pkmSyncKey
        pkmSyncKey =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15)
        await browser.storage.local.set({ PKMSYNCpkmSyncKey: pkmSyncKey })
    }

    return pkmSyncKey
}
