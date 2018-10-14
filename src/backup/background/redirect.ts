export function setupRequestInterceptor({
    webRequest,
    handleLoginRedirectedBack,
    memexCloudOrigin,
}) {
    webRequest.onBeforeRequest.addListener(
        makeRequestHandler({ handleLoginRedirectedBack }),
        { urls: [`${memexCloudOrigin}/auth/google/callback*`] },
        ['blocking'],
    )
}

export function makeRequestHandler({ handleLoginRedirectedBack }) {
    return ({ url, tabId }) => {
        if (tabId === -1) {
            // Came from bg script, prevent infinite loop of DOOM!
            return {}
        }

        handleLoginRedirectedBack(url)
        const targetUrl = `${chrome.extension.getURL('/options.html')}#/backup`
        return { redirectUrl: targetUrl }
    }
}
