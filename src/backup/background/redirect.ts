import { browser } from 'webextension-polyfill-ts'

export function setupRequestInterceptors({
    webRequest,
    handleLoginRedirectedBack,
    checkAutomaticBackupEnabled,
    memexCloudOrigin,
}) {
    if (handleLoginRedirectedBack) {
        webRequest.onBeforeRequest.addListener(
            makeGoogleCallbackHandler({ handleLoginRedirectedBack }),
            { urls: [`${memexCloudOrigin}/auth/google/callback*`] },
            ['blocking'],
        )
    }
    webRequest.onBeforeRequest.addListener(
        makeWooCommercePurchaseHandler({ checkAutomaticBackupEnabled }),
        { urls: ['https://worldbrain.io/order-received/thank-you/redirect/'] },
        ['blocking'],
    )
}

export function makeGoogleCallbackHandler({ handleLoginRedirectedBack }) {
    return ({ url, tabId }) => {
        if (tabId === -1) {
            // Came from bg script, prevent infinite loop of DOOM!
            return {}
        }

        handleLoginRedirectedBack(url)
        const targetUrl = `${browser.extension.getURL('/options.html')}#/backup`
        return { redirectUrl: targetUrl }
    }
}

export function makeWooCommercePurchaseHandler({
    checkAutomaticBackupEnabled,
}) {
    return () => {
        checkAutomaticBackupEnabled()
        const targetUrl = `${browser.extension.getURL('/options.html')}#/backup`
        return { redirectUrl: targetUrl }
    }
}
