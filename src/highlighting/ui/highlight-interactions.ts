import analytics from 'src/analytics'
import { getOffsetTop } from 'src/sidebar-overlay/utils'
import {
    Anchor,
    Highlight,
    HighlightInteractionsInterface,
} from 'src/highlighting/types'
import { retryUntil } from 'src/util/retry-until'
import { descriptorToRange, markRange } from './anchoring/index'
import * as Raven from 'src/util/raven'
import { Annotation } from 'src/annotations/types'
import { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import * as anchoring from 'src/highlighting/ui/anchoring'
import {
    AnnotationCacheChangeEvents,
    AnnotationsCacheInterface,
} from 'src/annotations/annotations-cache'
import { generateUrl } from 'src/annotations/utils'
import { AnalyticsEvent } from 'src/analytics/types'

const styles = require('src/highlighting/ui/styles.css')

export async function renderHighlightFromSelection(options: {
    selection: Selection
    pageUrl: string
    title: string
    temporary: boolean
}) {
    const { selection, pageUrl, title, temporary } = options

    const anchor = await extractAnchorFromSelection(selection)
    const body = anchor ? anchor.quote : ''

    const highlight = {
        pageUrl,
        title,
        comment: '',
        tags: [],
        body,
        selector: anchor,
    } as Partial<Annotation>

    renderHighlight(highlight as Highlight, () => false, temporary)

    return highlight
}

export const extractAnchorFromSelection = async (
    selection: Selection,
): Promise<Anchor> => {
    const quote = selection.toString()
    const descriptor = await anchoring.selectionToDescriptor({ selection })
    return {
        quote,
        descriptor,
    }
}

export interface HighlightRenderInterface {
    renderHighlights: (
        highlights: Highlight[],
        onClick: AnnotationClickHandler,
        temp?: boolean,
    ) => void
    renderHighlight: (
        highlight: Highlight,
        onClick: AnnotationClickHandler,
    ) => void
    undoHighlight: (uniqueUrl: string) => void
    undoAllHighlights: () => void
}

export type AnnotationClickHandler = (params: { annotationUrl: string }) => void

// TODO: (sidebar-refactor) move to somewhere more highlight content script related
export const renderAnnotationCacheChanges = ({
    cacheChanges,
    onClickHighlight,
    renderer,
}: {
    cacheChanges: AnnotationCacheChangeEvents
    onClickHighlight: AnnotationClickHandler
    renderer: HighlightRenderInterface
}) => {
    const onRollback = (annotations) => {
        renderer.undoAllHighlights()
        renderer.renderHighlights(
            annotations as Highlight[],
            onClickHighlight,
            false,
        )
    }
    const onCreated = (annotation) => {
        renderer.renderHighlight(annotation as Highlight, onClickHighlight)
    }
    const onDeleted = (annotation) => {
        renderer.undoHighlight(annotation.url)
    }

    cacheChanges.on('rollback', onRollback)
    cacheChanges.on('created', onCreated)
    cacheChanges.on('deleted', onDeleted)

    return () => {
        cacheChanges.removeListener('rollback', onRollback)
        cacheChanges.removeListener('created', onCreated)
        cacheChanges.removeListener('deleted', onDeleted)
    }
}

// TODO: (sidebar-refactor) move to somewhere more sidebar related
export const createAnnotationWithSidebar = async (params: {
    getSelection: () => Selection
    getUrlAndTitle: () => { pageUrl: string; title: string }
    inPageUI: SharedInPageUIInterface
    analyticsEvent?: AnalyticsEvent
}) => {
    analytics.trackEvent(
        params.analyticsEvent ?? {
            category: 'Annotations',
            action: 'create',
        },
    )

    const selection = params.getSelection()
    const { pageUrl, title } = params.getUrlAndTitle()

    if (!selection || selection.isCollapsed) {
        params.inPageUI.showSidebar({ action: 'comment' })
        return
    }

    const highlight = await renderHighlightFromSelection({
        selection,
        pageUrl,
        title,
        temporary: true,
    })

    params.inPageUI.showSidebar({
        action: 'comment',
        anchor: highlight.selector,
    })
}

export interface SaveAndRenderHighlightDependencies {
    annotationsCache: AnnotationsCacheInterface
    onClickHighlight: AnnotationClickHandler
    getSelection: () => Selection
    getUrlAndTitle: () => { pageUrl: string; title: string }
    analyticsEvent?: AnalyticsEvent
}

export type HighlightRendererInterface = HighlightRenderInterface &
    HighlightInteractionsInterface

export class HighlightRenderer implements HighlightRendererInterface {
    createAnnotationWithSidebar = createAnnotationWithSidebar

    saveAndRenderHighlight = async (
        params: SaveAndRenderHighlightDependencies,
    ) => {
        analytics.trackEvent(
            params.analyticsEvent ?? {
                category: 'Highlights',
                action: 'create',
            },
        )

        const anchor = await extractAnchorFromSelection(getSelection())
        const body = anchor ? anchor.quote : ''
        const comment = ''
        const tags = []
        const { pageUrl, title } = params.getUrlAndTitle()

        const annotation = {
            url: generateUrl({ pageUrl, now: () => Date.now() }),
            body,
            comment,
            pageUrl,
            pageTitle: title,
            selector: anchor,
            tags,
        } as Annotation
        params.annotationsCache.create(annotation)

        await this.renderHighlight(annotation as Highlight, () => {
            params.onClickHighlight({ annotationUrl: annotation.url })
        })
    }

    /**
     * Given an array of highlight objects, highlights all of them.
     */
    renderHighlights = async (highlights: Highlight[], onClick) => {
        await Promise.all(
            highlights.map(async (highlight) =>
                this.renderHighlight(highlight, onClick),
            ),
        )
    }

    renderHighlight = async (
        highlight: Highlight,
        onClick: AnnotationClickHandler,
        temporary = false,
    ) => {
        if (!highlight?.selector?.descriptor?.content) {
            return
        }

        const baseClass =
            styles[temporary ? 'memex-highlight-tmp' : 'memex-highlight']

        try {
            await Raven.context(async () => {
                const descriptor = highlight.selector.descriptor

                Raven.captureBreadcrumb({
                    message: 'annotation-selector-received',
                    category: 'annotations',
                    data: highlight,
                })

                const range = await retryUntil(
                    () => descriptorToRange({ descriptor }),
                    (_range) => _range !== null,
                    {
                        intervalMiliseconds: 200,
                        timeoutMiliseconds: 5000,
                    },
                )

                markRange({ range, cssClass: baseClass })

                this.attachEventListenersToNewHighlights(highlight, onClick)
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
        openSidebar: AnnotationClickHandler,
    ) => {
        const newHighlights = document.querySelectorAll(
            `.${styles['memex-highlight']}:not([data-annotation])`,
        )
        newHighlights.forEach((highlightEl) => {
            ;(highlightEl as HTMLElement).dataset.annotation = highlight.url

            const clickListener = async (e) => {
                // Let anchors behave as normal
                const parentNode = e.target?.parentNode
                if (
                    parentNode?.nodeName?.toLowerCase() === 'a' &&
                    parentNode?.href.length
                ) {
                    return
                }

                e.preventDefault()
                if (!e.target.dataset.annotation) {
                    return
                }
                openSidebar({ annotationUrl: highlight.url })
                this.removeHighlights(true)
                this.makeHighlightDark(highlight)
            }
            highlightEl.addEventListener('click', clickListener, false)

            const mouseenterListener = (e) => {
                if (!e.target.dataset.annotation) {
                    return
                }
                this.removeMediumHighlights()
                this.makeHighlightMedium(highlight)
            }
            highlightEl.addEventListener(
                'mouseenter',
                mouseenterListener,
                false,
            )

            const mouseleaveListener = (e) => {
                if (!e.target.dataset.annotation) {
                    return
                }
                this.removeMediumHighlights()
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
        prevHighlights.forEach((highlight) =>
            highlight.classList.remove(mediumClass),
        )
    }

    removeTempHighlights = () => {
        const baseClass = styles['memex-highlight-tmp']
        const prevHighlights = document.querySelectorAll(`.${baseClass}`)
        prevHighlights.forEach((highlight) => this._removeHighlight(highlight))
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
        highlights.forEach((highlight) => highlight.classList.add(mediumClass))
    }
    /**
     * Makes the highlight a dark highlight.
     */
    makeHighlightDark = ({ url }: Highlight) => {
        const baseClass = styles['memex-highlight']
        const highlights = document.querySelectorAll(
            `.${baseClass}[data-annotation="${url}"]`,
        )

        highlights.forEach((highlight) => {
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
            highlights.forEach((highlight) =>
                highlight.classList.remove(styles['dark']),
            )
        } else {
            highlights.forEach((highlight) => this._removeHighlight(highlight))
        }
    }
    undoAllHighlights = this.removeHighlights

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
            (offsetTopObject) => annotations[offsetTopObject.index],
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
        highlights.forEach((highlight) => this._removeHighlight(highlight))
    }

    undoHighlight = this.removeAnnotationHighlights
}

// FIXME: Refactor the parts of the code that need these global function imports
export const makeHighlightDark = new HighlightRenderer().makeHighlightDark
export const scrollToHighlight = new HighlightRenderer().scrollToHighlight
export const renderHighlights = new HighlightRenderer().renderHighlights
export const renderHighlight = new HighlightRenderer().renderHighlight
export const removeHighlights = new HighlightRenderer().removeHighlights
export const removeAnnotationHighlights = new HighlightRenderer()
    .removeAnnotationHighlights
