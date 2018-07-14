import scrollToElement from 'scroll-to-element'

import { highlightAnnotation } from 'src/direct-linking/content_script/rendering'
import { injectCSS } from 'src/search-injection/dom'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { setupRibbonUI, destroyAll } from '../components'

import styles from 'src/direct-linking/content_script/styles.css'

export function scrollToHighlight({ isDark }) {
    const highlightClass = isDark ? 'memex-highlight-dark' : 'memex-highlight'
    const $highlight = document.querySelector('.' + styles[highlightClass])
    if ($highlight) {
        setTimeout(() => {
            scrollToElement($highlight, { offset: -225 })
        }, 300)
    } else {
        console.error('MEMEX: Oops, no highlight found to scroll to')
    }
}

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
export const highlightAnnotations = async (annotations, focusOnAnnotation) => {
    annotations.forEach(
        async annotation =>
            await highlightAnnotation({ annotation }, focusOnAnnotation),
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

let listener = null

export const attachEventListenersToNewHighlights = (
    highlightClass,
    annotation,
    focusOnAnnotation,
) => {
    const newHighlights = document.querySelectorAll(
        `.${highlightClass}:not([data-annotation])`,
    )
    newHighlights.forEach(highlight => {
        highlight.dataset.annotation = 'yes'

        if (!focusOnAnnotation) return

        listener = async e => {
            e.preventDefault()
            if (!e.target.dataset.annotation) return
            removeHighlights({ isDark: true })
            await highlightAnnotation({ annotation, isDark: true }, null)
            focusOnAnnotation(annotation.url)
        }

        highlight.addEventListener('click', listener, false)
    })
}

export function removeHighlights({ isDark }) {
    const highlightClass = isDark ? 'memex-highlight-dark' : 'memex-highlight'
    const className = styles[highlightClass]
    const highlights = document.querySelectorAll('.' + className)

    highlights.forEach(highlight => {
        highlight.classList.remove(className)
        highlight.dataset.annotation = ''
        highlight.removeEventListener('click', listener)
    })
}
