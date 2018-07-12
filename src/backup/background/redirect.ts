// Google Drive doesn't allow redirecting back to an extension page, so we're intercepting a request to a non-existing page instead

export function setupRequestInterceptor({ webRequest }) {
    webRequest.onBeforeRequest.addListener(
        makeRequestHandler(),
        { urls: ['*://memex.cloud/backup/auth-redirect/google-drive'] },
        ['blocking'],
    )
}

export function makeRequestHandler() {
    return ({ url, tabId }) => {
        const targetUrl = 'chrome-extension://hideohpekofebnpgkolicememphnnidf/options.html#/backup'
        return { redirectUrl: targetUrl }
    }
}
