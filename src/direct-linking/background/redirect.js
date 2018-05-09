export function setupRequestInterceptor({ requests, webRequest }) {
    webRequest.onBeforeRequest.addListener(
        makeRequestHandler({ requests }),
        { urls: ['*://memex.link/*', '*://staging.memex.link/*'] },
        ['blocking'],
    )
}

export function makeRequestHandler({ requests }) {
    return ({ url, tabId }) => {
        if (/annotation.json$/.test(url)) {
            return
        }

        const result = /(https?:\/\/(?:staging\.)?memex.link)\/([^/]+)\/(.+)$/.exec(
            url,
        )
        const memexLinkOrigin = result[1]
        const annotationId = result[2]
        const targetUrl = 'http://' + result[3]
        requests.request({ memexLinkOrigin, annotationId, tabId })
        return { redirectUrl: targetUrl }
    }
}
