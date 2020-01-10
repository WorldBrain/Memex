import { browser } from 'webextension-polyfill-ts'

export function setupRequestInterceptors({
    webRequest,
    handleLoginRedirectedBack,
    isAutomaticBackupEnabled,
    memexCloudOrigin,
}) {
    if (handleLoginRedirectedBack) {
        webRequest.onBeforeRequest.addListener(
            makeGoogleCallbackHandler({ handleLoginRedirectedBack }),
            { urls: [`${memexCloudOrigin}/auth/google/callback*`] },
            ['blocking'],
        )
    }
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
