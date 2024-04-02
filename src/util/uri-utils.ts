import browser, { Runtime } from 'webextension-polyfill'
import { isUrlPDFViewerUrl } from 'src/pdf/util'

/**
 * Some URLs, like those of the PDF viewer, hide away the underlying resource's URL.
 * This function will detect special cases and return the underlying resource's URL, if a special case.
 * Should operate like identity function for non-special cases.
 */
export const getUnderlyingResourceUrl = (
    url: string,
    browserAPIs: { runtimeAPI: Pick<Runtime.Static, 'getURL'> } = {
        runtimeAPI: browser.runtime,
    },
) => {
    if (isUrlPDFViewerUrl(url, browserAPIs)) {
        return new URL(url).searchParams.get('file')
    }

    return url
}

export const resolveTabUrl = (tab) => {
    if (tab) {
        tab.url = getUnderlyingResourceUrl(tab.url)
    }
    return tab
}
