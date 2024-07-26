import { LOCAL_SERVER_ROOT } from 'src/backup-restore/ui/backup-pane/constants'
import type { Storage } from 'webextension-polyfill'

export async function getPkmSyncKey(deps: { storageAPI: Storage.Static }) {
    let data = await deps.storageAPI.local.get('PKMSYNCpkmSyncKey')

    let pkmSyncKey = data.PKMSYNCpkmSyncKey

    // If pkmSyncKey does not exist, create a new one and store it in local storage
    if (!pkmSyncKey) {
        // Generate a random string for pkmSyncKey
        pkmSyncKey =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15)
        await deps.storageAPI.local.set({ PKMSYNCpkmSyncKey: pkmSyncKey })
    }

    return pkmSyncKey
}

export async function isPkmSyncEnabled(deps: { storageAPI: Storage.Static }) {
    try {
        const data = await deps.storageAPI.local.get('PKMSYNCpkmFolders')
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

export async function getFolder(
    pkmToSync: string,
    deps: { storageAPI: Storage.Static },
) {
    const pkmSyncKey = await getPkmSyncKey(deps)

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
    let data = await deps.storageAPI.local.get('PKMSYNCpkmFolders')
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
    await deps.storageAPI.local.set({ PKMSYNCpkmFolders: data })

    return data
}
