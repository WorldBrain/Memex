import replaceImgSrcWithFunctionOutput from '@worldbrain/memex-common/lib/annotations/replaceImgSrcWithCloudAddress'
import { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { LOCAL_SERVER_ROOT } from 'src/backup-restore/ui/backup-pane/constants'
// TODO: Refactor this so it's not importing and using the browser global
import { browser } from 'webextension-polyfill-ts'

export async function shareAnnotationWithPKM(
    annotationData,
    pkmSyncBG,
    imageSupport,
    checkForFilteredSpaces?,
) {
    let item = {
        type: 'annotation',
        data: annotationData,
    }

    if (
        item.data.pageUrl.includes('twitter.com') ||
        item.data.pageUrl.includes('x.com')
    ) {
        if (item.data.pageTitle.length === 0) {
            return
        }
        let title = item.data.pageTitle?.replace(/[^a-zA-Z0-9]/g, ' ')
        title = item.data.pageTitle?.substring(0, 100).trim()
        title = item.data.pageTitle
            ?.substring(0, 100)
            .trim()
            .replace(/\n/g, ' ')

        if (annotationData.comment) {
            annotationData = await replaceImgSrcWithFunctionOutput(
                annotationData.comment,
                process.env.NODE_ENV,
            )
        }

        const itemToSync = {
            annotationId: annotationData.annotationId,
            pageTitle: title,
            body: annotationData.body,
            comment: annotationData.comment,
            createdWhen: annotationData.createdWhen,
            color: annotationData.color,
            pageCreatedWhen: annotationData.pageCreatedWhen,
            pageUrl: annotationData.pageUrl,
        }

        item = {
            type: 'annotation',
            data: itemToSync,
        }

        await pkmSyncBG.pushPKMSyncUpdate(item, checkForFilteredSpaces)
    } else {
        await pkmSyncBG.pushPKMSyncUpdate(item, checkForFilteredSpaces)
    }
}
export async function sharePageWithPKM(
    pageData,
    pkmSyncBG,
    checkForFilteredSpaces?,
) {
    let item = {
        type: 'page',
        data: pageData,
    }

    if (
        item.data.pageUrl.includes('twitter.com') ||
        item.data.pageUrl.includes('x.com')
    ) {
        if (item.data.pageTitle.length === 0) {
            return
        }
        let title = item.data.pageTitle?.replace(/[^a-zA-Z0-9]/g, ' ')
        title = item.data.pageTitle?.substring(0, 100).trim()
        title = item.data.pageTitle
            ?.substring(0, 100)
            .trim()
            .replace(/\n/g, ' ')

        const annotatinon =
            '<div>' + item.data.pageTitle.replace(/\n/g, '<br/>') + '</div>'

        const itemToSync = {
            annotationId: item.data.pageUrl,
            pageTitle: title,
            pageUrl: item.data.pageUrl,
            pageCreatedWhen: item.data.createdWhen,
            comment: annotatinon,
            createdWhen: item.data.createdWhen,
        }

        item = {
            type: 'annotation',
            data: itemToSync,
        }

        await pkmSyncBG.pushPKMSyncUpdate(item, checkForFilteredSpaces)
    } else {
        await pkmSyncBG.pushPKMSyncUpdate(item, checkForFilteredSpaces)
    }
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

export async function isPkmSyncEnabled() {
    try {
        const data = await browser.storage.local.get('PKMSYNCpkmFolders')
        if (
            data.PKMSYNCpkmFolders &&
            (data.PKMSYNCpkmFolders.obsidianFolder?.length > 0 ||
                data.PKMSYNCpkmFolders.logSeqFolder?.length > 0)
        ) {
            return true
        }

        return false
    } catch (e) {
        return false
    }
}

export async function getFolder(pkmToSync: string) {
    const pkmSyncKey = await getPkmSyncKey()

    const serverToTalkTo = LOCAL_SERVER_ROOT

    const getFolderPath = async (pkmToSync: string) => {
        const response = await fetch(`${serverToTalkTo}/set-directory`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pkmSyncType: pkmToSync,
                syncKey: pkmSyncKey,
            }),
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const directoryPath = await response.text()

        return directoryPath
    }

    const folderPath = await getFolderPath(pkmToSync)

    // Fetch the existing "PKMSYNCpkmFolders" from local storage
    let data = await browser.storage.local.get('PKMSYNCpkmFolders')
    data = data.PKMSYNCpkmFolders || {}

    // Update the value in it that corresponds to the pkmToSync
    if (pkmToSync === 'logseq') {
        data['logSeqFolder'] = folderPath
    } else if (pkmToSync === 'obsidian') {
        data['obsidianFolder'] = folderPath
    } else if (pkmToSync === 'backup') {
        data['backupFolder'] = folderPath
    }

    // Write the update to local storage
    await browser.storage.local.set({ PKMSYNCpkmFolders: data })

    return data
}

export async function getPathsFromLocalStorage() {
    const data = await browser.storage.local.get('PKMSYNCpkmFolders')

    return data.PKMSYNCpkmFolders
}

export type rabbitHoleDocument = {
    pageTitle: string
    fullUrl: string
    createdWhen: Date | number
    creatorId: string | AutoPk
    contentType: string
    fullHTML: string
}

export async function createRabbitHoleEntry(
    entryData: rabbitHoleDocument,
    pkmSyncBG,
    checkForFilteredSpaces?,
) {
    await pkmSyncBG.pushRabbitHoleUpdate(entryData, checkForFilteredSpaces)
}

export async function addFeedSources(feedSources, pkmSyncBG) {
    await pkmSyncBG.addFeedSources(feedSources)
}
