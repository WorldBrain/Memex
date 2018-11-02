import { remoteFunction } from 'src/util/webextensionRPC'

export async function redirectToGDriveLogin() {
    window.location.href = await remoteFunction('getBackupProviderLoginLink')({
        returnUrl: 'http://memex.cloud/backup/auth-redirect/google-drive',
        provider: 'googledrive',
    })
}

export function redirectToAutomaticBackupPurchase(billingPeriod) {
    const productId = 7542
    const variationId = billingPeriod === 'yearly' ? 7545 : 7544

    window.location.href = `http://worldbrain.io/?add-to-cart=${productId}&variation_id=${variationId}`
}
