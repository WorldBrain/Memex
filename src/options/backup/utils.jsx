import { remoteFunction } from 'src/util/webextensionRPC'

export async function redirectToGDriveLogin() {
    window.location.href = await remoteFunction('getBackupProviderLoginLink')({
        returnUrl: 'http://memex.cloud/backup/auth-redirect/google-drive',
        provider: 'googledrive',
    })
}
