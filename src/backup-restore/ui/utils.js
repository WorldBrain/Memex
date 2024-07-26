import { remoteFunction } from 'src/util/webextensionRPC'
import { LOCAL_SERVER_ENDPOINTS } from './backup-pane/constants'
import { getPkmSyncKey } from 'src/pkm-integrations/utils'
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

export const checkServerStatus = async ({ storageAPI }) => {
    try {
        const syncKey = await getPkmSyncKey({ storageAPI })

        const body = JSON.stringify({
            syncKey: syncKey,
        })

        try {
            const response = await fetch(LOCAL_SERVER_ENDPOINTS.STATUS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body,
            })

            if (response.status === 200) {
                return true
            } else if (response.status === 500) {
                return false
            } else {
                return false
            }
        } catch (e) {
            return false
        }
    } catch (err) {
        return false
    }
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
