import { browser } from 'webextension-polyfill-ts'

export function setupRequestInterceptors({
    webRequest,
    handleLoginRedirectedBack,
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

        // to get around the blocked state of the request, we update the original tab with the backup screen.
        // this is probably a bit glitchy at first, but we may be able to improve on that experience. For now it should be OK.
        setTimeout(() => {
            browser.tabs.update(tabId, { active: true, url: targetUrl })
        }, 1000)

        return { redirectUrl: targetUrl }
    }
}
