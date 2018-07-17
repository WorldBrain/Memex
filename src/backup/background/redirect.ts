// Google Drive doesn't allow redirecting back to an extension page, so we're intercepting a request to a non-existing page instead
// We do get the access token as a params, so we should give that back to the backend

export function setupRequestInterceptor({ webRequest, handleLoginRedirectedBack }) {
    webRequest.onBeforeRequest.addListener(
        makeRequestHandler({ handleLoginRedirectedBack }),
        { urls: ['*://memex.cloud/backup/auth-redirect/google-drive'] },
        ['blocking'],
    )
}

export function makeRequestHandler({ handleLoginRedirectedBack }) {
    return ({ url, tabId }) => {
        console.log('Got Google login redirect:', url)
        handleLoginRedirectedBack(url)
        const targetUrl = 'chrome-extension://hideohpekofebnpgkolicememphnnidf/options.html#/backup'
        return { redirectUrl: targetUrl }
    }
}
