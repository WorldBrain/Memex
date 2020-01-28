import { getOffsetTop } from 'src/sidebar-overlay/utils'
import { Annotation } from 'src/sidebar-overlay/sidebar/types'
import { Highlight } from 'src/highlighting/types'
import { retryUntil } from 'src/util/retry-until'
import { descriptorToRange, markRange } from './anchoring/index'
import * as AllRaven from 'raven-js'
const styles = require('src/highlighting/ui/styles.css')
const Raven = AllRaven['default']

/**
 * Given an array of highlight objects, highlights all of them.
 */
export const renderHighlights = async (
    highlights: Highlight[],
    openSidebar: (args: { activeUrl?: string }) => void,
    focusOnHighlight?: (url: string) => void,
    hoverHighlightContainer?: (url: string) => void,
) => {
    await Promise.all(
        highlights.map(async highlight =>
            renderHighlight(
                highlight,
                focusOnHighlight,
                hoverHighlightContainer,
                openSidebar,
            ),
        ),
    )
}

export const renderHighlight = async (
    highlight: Highlight,
    focusOnAnnotation,
    hoverAnnotationContainer,
    openSidebar,
) => {
    const baseClass = styles['memex-highlight']
    try {
        await Raven.context(async () => {
            const descriptor = highlight.anchors
                ? highlight.anchors[0].descriptor
                : highlight.selector.descriptor

            Raven.captureBreadcrumb({
                message: 'annotation-selector-received',
                category: 'annotations',
                data: highlight,
            })

            const range = await retryUntil(
                () => descriptorToRange({ descriptor }),
                _range => _range !== null,
                {
                    intervalMiliseconds: 200,
                    timeoutMiliseconds: 5000,
                },
            )

            markRange({ range, cssClass: baseClass })

            attachEventListenersToNewHighlights(
                highlight,
                focusOnAnnotation,
                hoverAnnotationContainer,
                openSidebar,
            )
        })
    } catch (e) {
        console.error(
            'MEMEX: Error during annotation anchoring/highlighting:',
            e,
        )
        console.error(e.stack)
        return false
    }

    return true
}

/**
 * Scrolls to the highlight of the given annotation on the current page.
 */
export const scrollToHighlight = ({ url }: Highlight) => {
    const baseClass = styles['memex-highlight']
    const $highlight = document.querySelector(
        `.${baseClass}[data-annotation="${url}"]`,
    ) as HTMLElement

    if ($highlight) {
        const top = getOffsetTop($highlight) - window.innerHeight / 2
        window.scrollTo({ top, behavior: 'smooth' })
        // The pixels scrolled need to be returned in order to restrict
        // scrolling when mouse is over the sidebar.
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
export const highlightAndScroll = (annotation: Annotation) => {
    removeHighlights(true)
    makeHighlightDark(annotation)
    return scrollToHighlight(annotation)
}

/**
 * Attaches event listeners to the highlights for hovering/focusing on the
 * annotation in sidebar.
 * @param {Highlight} highlight The annotation to which the listeners are going to be attached
 * @param {function} focusOnAnnotation Function when called will set the sidebar container to active state
 * @param {function} hoverAnnotationContainer Function when called will set the sidebar container to hover state
 * @param openSidebar
 */
export const attachEventListenersToNewHighlights = (
    highlight: Highlight,
    focusOnAnnotation: (url: string) => void = _ => undefined,
    hoverAnnotationContainer: (url: string) => void = _ => undefined,
    openSidebar: (args: { activeUrl?: string }) => void,
) => {
    const newHighlights = document.querySelectorAll(
        `.${styles['memex-highlight']}:not([data-annotation])`,
    )
    newHighlights.forEach(highlightEl => {
        ;(highlightEl as HTMLElement).dataset.annotation = highlight.url

        const clickListener = async e => {
            e.preventDefault()
            if (!e.target.dataset.annotation) {
                return
            }
            openSidebar({ activeUrl: highlight.url })
            removeHighlights(true)
            makeHighlightDark(highlight)
            focusOnAnnotation(highlight.url)
        }
        highlightEl.addEventListener('click', clickListener, false)

        const mouseenterListener = e => {
            if (!e.target.dataset.annotation) {
                return
            }
            removeMediumHighlights()
            makeHighlightMedium(highlight)
            hoverAnnotationContainer(highlight.url)
        }
        highlightEl.addEventListener('mouseenter', mouseenterListener, false)

        const mouseleaveListener = e => {
            if (!e.target.dataset.annotation) {
                return
            }
            removeMediumHighlights()
            hoverAnnotationContainer(null)
        }
        highlightEl.addEventListener('mouseleave', mouseleaveListener, false)
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
export const makeHighlightMedium = ({ url }: Highlight) => {
    // Make the current annotation as a "medium" highlight.
    const baseClass = styles['memex-highlight']
    const mediumClass = styles['medium']
    const highlights = document.querySelectorAll(
        `.${baseClass}[data-annotation="${url}"]`,
    )
    highlights.forEach(highlight => highlight.classList.add(mediumClass))
}
/**
 * Makes the highlight a dark highlight.
 */
export const makeHighlightDark = ({ url }: Highlight) => {
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
 * If `onlyRemoveDarkHighlights` is true, only dark highlights will be removed.
 */
export const removeHighlights = (onlyRemoveDarkHighlights = false) => {
    const baseClass = '.' + styles['memex-highlight']
    const darkClass = onlyRemoveDarkHighlights ? '.' + styles['dark'] : ''
    const highlightClass = `${baseClass}${darkClass}`
    const highlights = document.querySelectorAll(highlightClass)

    if (onlyRemoveDarkHighlights) {
        highlights.forEach(highlight =>
            highlight.classList.remove(styles['dark']),
        )
    } else {
        highlights.forEach(highlight => _removeHighlight(highlight))
    }
}
/**
 * Finds each annotation's position in page, sorts it by the position and
 * returns the sorted annotations.
 */
export const sortAnnotationsByPosition = (annotations: Annotation[]) => {
    const offsetTopObjects = annotations.map((annotation, index) => {
        const firstHighlight = document.querySelector(
            `.${styles['memex-highlight']}[data-annotation="${annotation.url}"]`,
        )
        return {
            index,
            offsetTop: firstHighlight
                ? getOffsetTop(firstHighlight as HTMLElement)
                : Infinity,
        }
    })

    const sortedOffsetTopObjects = offsetTopObjects.sort(
        (a, b) => a.offsetTop - b.offsetTop,
    )

    return sortedOffsetTopObjects.map(
        offsetTopObject => annotations[offsetTopObject.index],
    )
}

/**
 * Unwraps the `memex-highlight` element from the highlight,
 * resetting the DOM Text to how it was.
 */
const _removeHighlight = (highlight: Element) => {
    const parent = highlight.parentNode
    while (highlight.firstChild) {
        parent.insertBefore(highlight.firstChild, highlight)
    }
    parent.removeChild(highlight)
}

/**
 * Removes all the highlights of a given annotation.
 * Called when the annotation is deleted.
 */
const _removeAnnotationHighlights = ({ url }: Annotation) => {
    const baseClass = styles['memex-highlight']
    const highlights = document.querySelectorAll(
        `.${baseClass}[data-annotation="${url}"]`,
    )
    highlights.forEach(highlight => _removeHighlight(highlight))
}
