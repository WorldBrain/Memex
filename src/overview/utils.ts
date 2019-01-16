import { browser } from 'webextension-polyfill-ts'

import { remoteFunction } from 'src/util/webextensionRPC'
import { Annotation } from 'src/sidebar-common/sidebar/types'

/**
 * Defines how to go to an annotation from the `overview` sidebar.
 * Returns a method that takes an annotation and goes to it.
 *
 * @param pageUrl The url of the page for which the annotations are shown.
 */
export const goToAnnotation = (pageUrl: string) => async (
    annotation: Annotation,
) => {
    if (!annotation.body) {
        return
    }

    const tab = await browser.tabs.create({
        active: true,
        url: pageUrl,
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
