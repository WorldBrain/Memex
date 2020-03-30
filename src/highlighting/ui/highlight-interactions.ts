import { getOffsetTop } from 'src/sidebar-overlay/utils'
import {
    Highlight,
    HighlightInteractionInterface,
} from 'src/highlighting/types'
import { retryUntil } from 'src/util/retry-until'
import { descriptorToRange, markRange } from './anchoring/index'
import * as Raven from 'src/util/raven'
import { Annotation } from 'src/annotations/types'

const styles = require('src/highlighting/ui/styles.css')

export class HighlightInteraction implements HighlightInteractionInterface {
    /**
     * Given an array of highlight objects, highlights all of them.
     */
    renderHighlights = async (
        highlights: Highlight[],
        openSidebar: (args: { activeUrl?: string }) => void,
        focusOnHighlight?: (url: string) => void,
        hoverHighlightContainer?: (url: string) => void,
    ) => {
        await Promise.all(
            highlights.map(async highlight =>
                this.renderHighlight(
                    highlight,
                    focusOnHighlight,
                    hoverHighlightContainer,
                    openSidebar,
                ),
            ),
        )
    }

    renderHighlight = async (
        highlight: Highlight,
        focusOnAnnotation,
        hoverAnnotationContainer,
        openSidebar,
        temporary = false,
    ) => {
        const baseClass =
            styles[temporary ? 'memex-highlight-tmp' : 'memex-highlight']
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

                this.attachEventListenersToNewHighlights(
                    highlight,
                    focusOnAnnotation,
                    hoverAnnotationContainer,
                    openSidebar,
                )
            })
        } catch (e) {
            Raven.captureException(e)
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
    scrollToHighlight = ({ url }: Highlight) => {
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
    highlightAndScroll = (annotation: Annotation) => {
        this.removeHighlights(true)
        this.makeHighlightDark(annotation)
        return this.scrollToHighlight(annotation)
    }

    /**
     * Attaches event listeners to the highlights for hovering/focusing on the
     * annotation in sidebar.
     * @param {Highlight} highlight The annotation to which the listeners are going to be attached
     * @param {function} focusOnAnnotation Function when called will set the sidebar container to active state
     * @param {function} hoverAnnotationContainer Function when called will set the sidebar container to hover state
     * @param openSidebar
     */
    attachEventListenersToNewHighlights = (
        highlight: Highlight,
        focusOnAnnotation: (url: string) => void = _ => undefined,
        hoverAnnotationContainer: (url: string) => void = _ => undefined,
        openSidebar: (args: {
            activeUrl?: string
            openSidebar?: boolean
        }) => void,
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
                openSidebar({ activeUrl: highlight.url, openSidebar: true })
                this.removeHighlights(true)
                this.makeHighlightDark(highlight)
                focusOnAnnotation(highlight.url)
            }
            highlightEl.addEventListener('click', clickListener, false)

            const mouseenterListener = e => {
                if (!e.target.dataset.annotation) {
                    return
                }
                this.removeMediumHighlights()
                this.makeHighlightMedium(highlight)
                hoverAnnotationContainer(highlight.url)
            }
            highlightEl.addEventListener(
                'mouseenter',
                mouseenterListener,
                false,
            )

            const mouseleaveListener = e => {
                if (!e.target.dataset.annotation) {
                    return
                }
                this.removeMediumHighlights()
                hoverAnnotationContainer(null)
            }
            highlightEl.addEventListener(
                'mouseleave',
                mouseleaveListener,
                false,
            )
        })
    }
    /**
     * Removes the medium class from all the highlights making them light.
     */
    removeMediumHighlights = () => {
        // Remove previous "medium" highlights
        const baseClass = styles['memex-highlight']
        const mediumClass = styles['medium']
        const prevHighlights = document.querySelectorAll(
            `.${baseClass}.${mediumClass}`,
        )
        prevHighlights.forEach(highlight =>
            highlight.classList.remove(mediumClass),
        )
    }

    removeTempHighlights = () => {
        const baseClass = styles['memex-highlight-tmp']
        const prevHighlights = document.querySelectorAll(`.${baseClass}`)
        prevHighlights.forEach(highlight => this._removeHighlight(highlight))
    }
    /**
     * Makes the given annotation as a medium highlight.
     * @param {string} url PK of the annotation to make medium
     */
    makeHighlightMedium = ({ url }: Highlight) => {
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
    makeHighlightDark = ({ url }: Highlight) => {
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
    removeHighlights = (onlyRemoveDarkHighlights = false) => {
        this.removeTempHighlights()

        const baseClass = '.' + styles['memex-highlight']
        const darkClass = onlyRemoveDarkHighlights ? '.' + styles['dark'] : ''
        const highlightClass = `${baseClass}${darkClass}`
        const highlights = document.querySelectorAll(highlightClass)

        if (onlyRemoveDarkHighlights) {
            highlights.forEach(highlight =>
                highlight.classList.remove(styles['dark']),
            )
        } else {
            highlights.forEach(highlight => this._removeHighlight(highlight))
        }
    }
    /**
     * Finds each annotation's position in page, sorts it by the position and
     * returns the sorted annotations.
     */
    sortAnnotationsByPosition = (annotations: Annotation[]) => {
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
    _removeHighlight = (highlight: Element) => {
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
    removeAnnotationHighlights = (url: string) => {
        const baseClass = styles['memex-highlight']
        const highlights = document.querySelectorAll(
            `.${baseClass}[data-annotation="${url}"]`,
        )
        highlights.forEach(highlight => this._removeHighlight(highlight))
    }
}

// FIXME: Refactor the parts of the code that need these global function imports
export const makeHighlightDark = new HighlightInteraction().makeHighlightDark
export const scrollToHighlight = new HighlightInteraction().scrollToHighlight
export const renderHighlights = new HighlightInteraction().renderHighlights
export const renderHighlight = new HighlightInteraction().renderHighlight
export const removeHighlights = new HighlightInteraction().removeHighlights
