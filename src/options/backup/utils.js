import { remoteFunction } from 'src/util/webextensionRPC'
import { LOCAL_SERVER_ENDPOINTS } from './constants'
export async function redirectToGDriveLogin() {
    window.location.href = await remoteFunction('getBackupProviderLoginLink')({
        returnUrl: 'http://memex.cloud/backup/auth-redirect/google-drive',
        provider: 'googledrive',
    })
}

export const getStringFromResponseBody = async response => {
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
        const response = await fetch(LOCAL_SERVER_ENDPOINTS.LOCATION)
        const backupPath = await getStringFromResponseBody(response)
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
        const response = await fetch(LOCAL_SERVER_ENDPOINTS.CHANGE_LOCATION)
        const backupPath = await getStringFromResponseBody(response)
        return backupPath
    } catch (err) {
        return false
    }
}
