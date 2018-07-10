import { highlightAnnotation } from 'src/direct-linking/content_script/rendering'
import {
    scrollToHighlight,
    removeHighlights,
} from 'src/direct-linking/content_script/interactions'

import { injectCSS } from 'src/search-injection/dom'
import { makeRemotelyCallable, remoteFunction } from 'src/util/webextensionRPC'
import { setupRibbonUI, destroyAll } from './components'
import { retryUntilErrorResolves } from './utils'

/**
 * Given an annotation object, highlights that text and removes other highlights
 * from the page.
 * @param {*} annotation Annotation object which has the selector to be highlighted
 */
export const highlightAndScroll = async annotation => {
    removeHighlights({ isDark: true })
    await highlightAnnotation({ annotation, isDark: true })
    scrollToHighlight({ isDark: true })
}

/**
 * Given an array of annotation objects, highlights all of them.
 * @param {Array<*>} annotations Array of annotations to highlight
 */
export const highlightAnnotations = async annotations => {
    annotations.forEach(
        async annotation => await highlightAnnotation({ annotation }),
    )
}

// Target container for the Ribbon/Sidebar iFrame
let target = null

/**
 * Creates target container for Ribbon and Sidebar iFrame.
 * Injects content_script.css.
 * Mounts Ribbon React component.
 * Sets up iFrame <--> webpage Remote functions.
 */
export const insertRibbon = () => {
    // If target is set, Ribbon has already been injected.
    if (target) return

    target = document.createElement('div')
    target.setAttribute('id', 'memex-annotations-ribbon')
    document.body.appendChild(target)

    const cssFile = browser.extension.getURL('content_script.css')
    injectCSS(cssFile)

    setupRibbonUI(target)
}

const removeRibbon = () => {
    if (!target) return

    destroyAll(target)()
    target = null
}

/**
 * Setups up RPC functions to insert and remove Ribbon from Popup.
 */
export const setupRPC = () => {
    makeRemotelyCallable({
        insertRibbon: () => {
            insertRibbon()
        },
        removeRibbon: () => {
            removeRibbon()
        },
    })
}

/**
 * HOF to return a function which
 * Scrolls to annotation or creates a new tab and then scrolls to annotation
 * Depending on the environment of the sidebar.
 * @param {*} annotation The annotation to go to.
 * @param {string} env The sidebar enviroment in which the function is being executed.
 * @param {string} pageUrl Url of the page highlight is in.
 * @param {function} highlightAndScroll Remote function which gets the passed annotation
 * @returns {Promise<function>}
 */

export const goToAnnotation = (
    env,
    pageUrl,
    highlightAndScroll,
) => annotation => async () => {
    // If annotation is a comment, do nothing
    if (!annotation.body) return false
    else if (env === 'overview') {
        const tab = await browser.tabs.create({
            active: true,
            url: pageUrl,
        })

        retryUntilErrorResolves(
            async () =>
                await remoteFunction('goToAnnotation', {
                    tabId: tab.id,
                })(annotation),
            { intervalMiliseconds: 1500, timeoutMiliseconds: 12000 },
        )

        // setTimeout(async () => {
        //     await remoteFunction('goToAnnotation', { tabId: tab.id })(
        //         annotation,
        //     )
        // }, 3000)
    } else {
        highlightAndScroll(annotation)
    }
}
