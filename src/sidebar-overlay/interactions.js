import { highlightAnnotation } from 'src/direct-linking/content_script/rendering'
import {
    scrollToHighlight,
    removeHighlights,
} from 'src/direct-linking/content_script/interactions'

import { injectCSS } from 'src/search-injection/dom'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { setUpRemoteFunctions, removeMessageListener } from './messaging'
import { setupRibbonUI, destroyAll } from './components'

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

    setUpRemoteFunctions({
        highlightAndScroll: (annotation, ...args) =>
            highlightAndScroll(annotation),
    })
}

const removeRibbon = () => {
    if (!target) return

    destroyAll(target)()
    removeMessageListener()
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
