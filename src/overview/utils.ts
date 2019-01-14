import { browser } from 'webextension-polyfill-ts'

import { remoteFunction } from 'src/util/webextensionRPC'
import { Annotation } from 'src/sidebar-common/types'

/**
 * Defines how to go to an annotation from the `overview` sidebar.
 * @param annotation The annotation/highlight to go to.
 */
export const goToAnnotation = async (annotation: Annotation) => {
    if (!annotation.body) {
        return
    }

    const tab = await browser.tabs.create({
        active: true,
        url: annotation.url,
    })

    const listener = async (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
            // Necessary to insert the ribbon/sidebar in case the user has turned
            // it off.
            await remoteFunction('insertRibbon', { tabId })()
            await remoteFunction('goToAnnotation', { tabId })(annotation)
            browser.tabs.onUpdated.removeListener(listener)
        }
    }

    browser.tabs.onUpdated.addListener(listener)
}
