import { browser } from 'webextension-polyfill-ts'

import { remoteFunction, runInTab } from 'src/util/webextensionRPC'
import { RibbonInteractionsInterface } from 'src/sidebar-overlay/ribbon/types'
import { Annotation } from 'src/annotations/types'

/**
 * Defines how to go to an annotation from the `overview` sidebar.
 * Returns a method that takes an annotation and goes to it.
 *
 * @param pageUrl The url of the page for which the annotations are shown.
 */
export const goToAnnotation = (pageUrl: string) => async (
    annotation: Annotation,
    env: 'inpage' | 'overview',
) => {
    if (!annotation.body) {
        return
    }

    pageUrl = pageUrl.startsWith('http') ? pageUrl : `https://${pageUrl}`

    if (env === 'overview') {
        const tab = await browser.tabs.create({
            active: true,
            url: pageUrl,
        })

        const listener = async (tabId, changeInfo) => {
            if (tabId === tab.id && changeInfo.status === 'complete') {
                // Necessary to insert the ribbon/sidebar in case the user has turned
                // it off.
                await runInTab<RibbonInteractionsInterface>(
                    tabId,
                ).insertRibbon({ forceExpandRibbon: true })
                await remoteFunction('goToAnnotation', { tabId })(annotation)
                browser.tabs.onUpdated.removeListener(listener)
            }
        }

        browser.tabs.onUpdated.addListener(listener)
    } else {
        await remoteFunction('goToAnnotationFromSidebar')({
            url: pageUrl,
            annotation,
        })
    }
}
