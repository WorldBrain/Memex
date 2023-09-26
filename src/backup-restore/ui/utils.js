import { remoteFunction } from 'src/util/webextensionRPC'
import { LOCAL_SERVER_ENDPOINTS } from './backup-pane/constants'
import { getFolder } from 'src/pkm-integrations/background/backend/utils'
export async function redirectToGDriveLogin() {
    window.location.href = await remoteFunction('getBackupProviderLoginLink')({
        returnUrl: 'http://memex.cloud/backup/auth-redirect/google-drive',
        provider: 'googledrive',
    })
}

export const getStringFromResponseBody = async (response) => {
    const { value } = await response.body.getReader().read()
    return new TextDecoder('utf-8').decode(value)
}

export const checkServerStatus = async () => {
    try {
        const response = await fetch(LOCAL_SERVER_ENDPOINTS.STATUS)
        const serverStatus = await getStringFromResponseBody(response)
        if (serverStatus === 'running') {
            return true
        }
    } catch (err) {
        return false
    }
    return false
}

export const fetchBackupPath = async () => {
    try {
        const storage = await browser.storage.local.get('PKMSYNCpkmFolders')
        const backupPath = storage.PKMSYNCpkmFolders.backupFolder
        // const syncKey = await getPkmSyncKey()
        // const body = {
        //     pkmSyncType: 'backup',
        //     syncKey: syncKey,
        // }
        // const response = await fetch(LOCAL_SERVER_ENDPOINTS.LOCATION, {
        //     method: 'GET',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(body),
        // })
        // const backupPath = await getStringFromResponseBody(response)

        if (backupPath && backupPath.length) {
            return backupPath
        }
    } catch (err) {
        return null
    }
    return null
}

export const changeBackupPath = async () => {
    try {
        const folder = await getFolder('backup')
        return folder
    } catch (err) {
        return false
    }
}
