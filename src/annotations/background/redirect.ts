import { WebRequest } from 'webextension-polyfill-ts'

import { AnnotationRequests } from './request'

export function setupRequestInterceptor({
    requests,
    webRequest,
}: {
    requests: AnnotationRequests
    webRequest: WebRequest.Static
}) {
    webRequest.onBeforeRequest.addListener(
        makeRequestHandler({ requests }),
        { urls: ['*://memex.link/*', '*://staging.memex.link/*'] },
        ['blocking'],
    )
}

export function makeRequestHandler({
    requests,
}: {
    requests: AnnotationRequests
}) {
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
