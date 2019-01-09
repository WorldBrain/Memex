import { highlightAnnotation } from 'src/direct-linking/content_script/rendering'
import { remoteFunction } from 'src/util/webextensionRPC'
import { getOffsetTop } from '../utils'
import styles from 'src/direct-linking/content_script/styles.css'

const openOptionsRPC = remoteFunction('openOptionsTab')

/**
 * Scrolls to the highlight of the passed annotation.
 * @param {*} annotation The annotation object to scroll to.
 */
export function scrollToHighlight(annotation) {
    const baseClass = styles['memex-highlight']
    const $highlight = document.querySelector(
        `.${baseClass}[data-annotation="${annotation.url}"]`,
    )

    if ($highlight) {
        Element.prototype.documentOffsetTop = function() {
            return (
                this.offsetTop +
                (this.offsetParent ? this.offsetParent.documentOffsetTop() : 0)
            )
        }

        const top = $highlight.documentOffsetTop() - window.innerHeight / 2
        window.scrollTo({ top, behavior: 'smooth' })
        // The pixels scrolled need to be returned in
        // order to restrict scrolling when mouse is
        // over the iFrame
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
    annotations.forEach(async annotation =>
        highlightAnnotation(
            { annotation },
            focusOnAnnotation,
            hoverAnnotationContainer,
        ),
    )
}

/**
 * Attaches event listeners to the highlightsfor hovering/focusing
 * on the annotaiton in sidebar.
 * @param {*} annotation The annotation to which the listeners are going to be attached
 * @param {function} focusOnAnnotation Function when called will set the sidebar container to active state
 * @param {function} hoverAnnotationContainer Function when called will set the sidebar container to hover state
 */
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
        if (!focusOnAnnotation || !hoverAnnotationContainer) {
            return
        }

        const clickListener = async e => {
            e.preventDefault()
            if (!e.target.dataset.annotation) {
                return
            }
            removeHighlights(true)
            makeHighlightDark(annotation)
            focusOnAnnotation(annotation.url)
        }
        highlight.addEventListener('click', clickListener, false)

        const mouseenterListener = e => {
            if (!e.target.dataset.annotation) {
                return
            }
            removeMediumHighlights()
            makeHighlightMedium(annotation)
            hoverAnnotationContainer(annotation.url)
        }
        highlight.addEventListener('mouseenter', mouseenterListener, false)

        const mouseleaveListener = e => {
            if (!e.target.dataset.annotation) {
                return
            }
            removeMediumHighlights()
            hoverAnnotationContainer('')
        }
        highlight.addEventListener('mouseleave', mouseleaveListener, false)
    })
}

/**
 * Removes the medium class from all the highlights making them light.
 */
export const removeMediumHighlights = () => {
    // Remove previous "medium" highlights
    const baseClass = styles['memex-highlight']
    const mediumClass = styles['medium']
    const prevHighlights = document.querySelectorAll(
        `.${baseClass}.${mediumClass}`,
    )
    prevHighlights.forEach(highlight => highlight.classList.remove(mediumClass))
}

/**
 * Makes the given annotation as a medium highlight.
 * @param {string} url PK of the annotation to make medium
 */
export const makeHighlightMedium = ({ url }) => {
    // Make the current annotation as a "medium" highlight
    const baseClass = styles['memex-highlight']
    const mediumClass = styles['medium']
    const highlights = document.querySelectorAll(
        `.${baseClass}[data-annotation="${url}"]`,
    )
    highlights.forEach(highlight => highlight.classList.add(mediumClass))
}

/**
 * Makes the highlight a dark highlight
 * @param {string} url PK of the annotation to make dark
 */

export const makeHighlightDark = ({ url }) => {
    const baseClass = styles['memex-highlight']
    const highlights = document.querySelectorAll(
        `.${baseClass}[data-annotation="${url}"]`,
    )

    highlights.forEach(highlight => {
        highlight.classList.add(styles['dark'])
    })
}

/**
 * Removes all highlight elements in the current page.
 * @param {bool} isDark If isDark is true, only dark highlights will be removed.
 */
export function removeHighlights(isDark = false) {
    const baseClass = '.' + styles['memex-highlight']
    const darkClass = isDark ? '.' + styles['dark'] : ''
    const highlightClass = `${baseClass}${darkClass}`
    const highlights = document.querySelectorAll(highlightClass)

    highlights.forEach(highlight => {
        highlight.classList.remove(styles['dark'])
        if (!isDark) {
            removeHighlight(highlight)
        }
    })
}

/**
 * Unwraps the span element from the highlight,
 * resetting the DOM Text to how it was.
 */
const removeHighlight = highlight => {
    const parent = highlight.parentNode
    while (highlight.firstChild) {
        parent.insertBefore(highlight.firstChild, highlight)
    }
    parent.removeChild(highlight)
}

/**
 * Removes all the highlights of a given annotation.
 * Called when the annotation is deleted.
 * @param {string} url PK of the annotation to be removed
 */
export const removeAnnotationHighlights = ({ url }) => {
    const baseClass = styles['memex-highlight']
    const highlights = document.querySelectorAll(
        `.${baseClass}[data-annotation="${url}"]`,
    )
    highlights.forEach(highlight => removeHighlight(highlight))
}

/**
 * Sends a message to the background to open up Memex Settings.
 */
export const openSettings = () => openOptionsRPC('settings')

/**
 * Finds each annotations position in page, sorts it by the position and returns.
 * @param {Array<*>} annotations Array of Annotation objects
 * @returns {Array<*>} Sorted array of Annotations
 */
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
