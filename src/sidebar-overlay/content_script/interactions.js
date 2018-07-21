import { highlightAnnotation } from 'src/direct-linking/content_script/rendering'
import { injectCSS } from 'src/search-injection/dom'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { setupRibbonUI, destroyAll } from '../components'
import { OPEN_OPTIONS } from '../../search-injection/constants'
import { getOffsetTop } from '../utils'
import styles from 'src/direct-linking/content_script/styles.css'

export function scrollToHighlight(annotation) {
    const baseClass = styles['memex-highlight']
    const $highlight = document.querySelector(
        `.${baseClass}[data-annotation="${annotation.url}"]`,
    )

    if ($highlight) {
        // Elements offset Top - offset
        const top = getOffsetTop($highlight) - 100
        setTimeout(() => {
            window.scrollTo({
                top,
                behavior: 'smooth',
            })
        }, 300)
        return top
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
    removeHighlights(true)
    makeHighlightDark(annotation)
    return scrollToHighlight(annotation)
}

/**
 * Given an array of annotation objects, highlights all of them.
 * @param {Array<*>} annotations Array of annotations to highlight
 */
export const highlightAnnotations = async (
    annotations,
    focusOnAnnotation,
    hoverAnnotationContainer,
) => {
    annotations.forEach(
        async annotation =>
            await highlightAnnotation(
                { annotation },
                focusOnAnnotation,
                hoverAnnotationContainer,
            ),
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

let clickListener = null
let mouseenterListener = null
let mouseleaveListener = null

export const attachEventListenersToNewHighlights = (
    annotation,
    focusOnAnnotation,
    hoverAnnotationContainer,
) => {
    const newHighlights = document.querySelectorAll(
        `.${styles['memex-highlight']}:not([data-annotation])`,
    )
    newHighlights.forEach(highlight => {
        highlight.dataset.annotation = annotation.url
        if (!focusOnAnnotation) return

        clickListener = async e => {
            e.preventDefault()
            if (!e.target.dataset.annotation) return
            removeHighlights(true)
            makeHighlightDark(annotation)
            focusOnAnnotation(annotation.url)
        }
        highlight.addEventListener('click', clickListener, false)

        mouseenterListener = e => {
            if (!e.target.dataset.annotation) return
            removeMediumHighlights()
            makeHighlightMedium(annotation)
            hoverAnnotationContainer(annotation.url)
        }
        highlight.addEventListener('mouseenter', mouseenterListener, false)

        mouseleaveListener = e => {
            if (!e.target.dataset.annotation) return
            removeMediumHighlights()
            hoverAnnotationContainer('')
        }
        highlight.addEventListener('mouseleave', mouseleaveListener, false)
    })
}

export const removeMediumHighlights = () => {
    // Remove previous "medium" highlights
    const baseClass = styles['memex-highlight']
    const mediumClass = styles['medium']
    const prevHighlights = document.querySelectorAll(
        `.${baseClass}.${mediumClass}`,
    )
    prevHighlights.forEach(highlight => highlight.classList.remove(mediumClass))
}

export const makeHighlightMedium = ({ url }) => {
    // Make the current annotation as a "medium" highlight
    const baseClass = styles['memex-highlight']
    const mediumClass = styles['medium']
    const highlights = document.querySelectorAll(
        `.${baseClass}[data-annotation="${url}"]`,
    )
    highlights.forEach(highlight => highlight.classList.add(mediumClass))
}

export const makeHighlightDark = ({ url }) => {
    const baseClass = styles['memex-highlight']
    const highlights = document.querySelectorAll(
        `.${baseClass}[data-annotation="${url}"]`,
    )

    highlights.forEach(highlight => {
        highlight.classList.add(styles['dark'])
    })
}

export function removeHighlights(isDark) {
    const baseClass = '.' + styles['memex-highlight']
    const darkClass = isDark ? '.' + styles['dark'] : ''
    const highlightClass = `${baseClass}${darkClass}`
    const highlights = document.querySelectorAll(highlightClass)

    highlights.forEach(highlight => {
        highlight.classList.remove(styles['dark'])
        if (!isDark) {
            highlight.classList.remove(styles['memex-highlight'])
            highlight.dataset.annotation = ''
            highlight.removeEventListener('click', clickListener)
            highlight.removeEventListener('mouseenter', mouseenterListener)
            highlight.removeEventListener('mouseleave', mouseleaveListener)
        }
    })
}

export const openSettings = () => {
    const message = {
        action: OPEN_OPTIONS,
        query: 'settings',
    }
    browser.runtime.sendMessage(message)
}

export const sortAnnotationByPosition = annotations => {
    const annotationsWithTops = annotations.map(annotation => {
        const firstHighlight = document.querySelector(
            `.${styles['memex-highlight']}[data-annotation="${
                annotation.url
            }"]`,
        )
        return {
            ...annotation,
            offsetTop: firstHighlight ? getOffsetTop(firstHighlight) : Infinity,
        }
    })
    return annotationsWithTops.sort((a, b) => a.offsetTop > b.offsetTop)
}
