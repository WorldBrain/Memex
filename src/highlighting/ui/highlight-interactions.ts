import analytics from 'src/analytics'
import debounce from 'lodash/debounce'

import { getOffsetTop } from 'src/sidebar-overlay/utils'
import {
    Anchor,
    Highlight,
    HighlightInteractionsInterface,
    HighlightElement,
} from 'src/highlighting/types'
import { AnnotationClickHandler } from 'src/highlighting/ui/types'
import { retryUntil } from 'src/util/retry-until'
import { descriptorToRange } from './anchoring/index'
import * as Raven from 'src/util/raven'
import { Annotation } from 'src/annotations/types'
import { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import * as anchoring from 'src/highlighting/ui/anchoring'
import {
    AnnotationCacheChangeEvents,
    AnnotationsCacheInterface,
} from 'src/annotations/annotations-cache'
import { generateAnnotationUrl } from 'src/annotations/utils'
import { AnalyticsEvent } from 'src/analytics/types'
import { highlightRange } from 'src/highlighting/ui/anchoring/highlighter'
import { getHTML5VideoTimestamp } from '@worldbrain/memex-common/lib/editor/utils'
import browser from 'webextension-polyfill'

const styles = require('src/highlighting/ui/styles.css')

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

export interface SaveAndRenderHighlightDeps {
    getUrlAndTitle: () => Promise<{ pageUrl: string; title: string }>
    getSelection: () => Selection
    annotationsCache: AnnotationsCacheInterface
    analyticsEvent?: AnalyticsEvent
    inPageUI: SharedInPageUIInterface
    shouldShare?: boolean
}

export type HighlightRendererInterface = HighlightRenderInterface &
    HighlightInteractionsInterface

export interface HighlightRendererDependencies {}
export class HighlightRenderer implements HighlightRendererInterface {
    private observer
    defaultHighlightColor
    currentActiveHighlight

    constructor(private deps: HighlightRendererDependencies) {
        document.addEventListener('click', this.handleOutsideHighlightClick)
        browser.storage.onChanged.addListener((change) => {
            this.defaultHighlightColor = change['@highlight-colors'].newValue
        })
    }

    private handleOutsideHighlightClick = async (e: MouseEvent) => {
        if (e.target === document.getElementById('memex-sidebar-container')) {
            return
        }

        const allHighlights = document.querySelectorAll(
            `.${styles['memex-highlight']}`,
        )

        for (const highlightEl of allHighlights) {
            if (e.target === highlightEl) {
                return
            }
        }

        this.removeSelectedHighlights(this.currentActiveHighlight)
    }

    saveAndRenderHighlightAndEditInSidebar = async (
        params: SaveAndRenderHighlightDeps & {
            showSpacePicker?: boolean
        },
    ) => {
        analytics.trackEvent(
            params.analyticsEvent ?? {
                category: 'Annotations',
                action: 'create',
            },
        )
        const annotation = await this._saveAndRenderHighlight(params)

        if (annotation) {
            await params.inPageUI.showSidebar({
                annotationUrl: annotation.url,
                action: params.showSpacePicker
                    ? 'edit_annotation_spaces'
                    : 'edit_annotation',
            })
        } else {
            await params.inPageUI.showSidebar({ action: 'comment' })
        }
    }

    saveAndRenderHighlight = async (params: SaveAndRenderHighlightDeps) => {
        analytics.trackEvent(
            params.analyticsEvent ?? {
                category: 'Highlights',
                action: 'create',
            },
        )

        await this._saveAndRenderHighlight(params)
    }

    private async _saveAndRenderHighlight(
        params: SaveAndRenderHighlightDeps,
    ): Promise<Annotation | null> {
        const selection = params.getSelection()
        const { pageUrl, title } = await params.getUrlAndTitle()

        // Enable support for any kind of HTML 5 video using annotation keyboard shortcuts to make notes without opening the sidebar and notes field first

        let videoTimeStampForComment
        const [videoURLWithTime, humanTimestamp] = getHTML5VideoTimestamp()

        if (videoURLWithTime != null) {
            videoTimeStampForComment = `[${humanTimestamp}](${videoURLWithTime})`
        }

        if (
            (!selection || selection.isCollapsed) &&
            videoTimeStampForComment == null
        ) {
            return null
        }

        const anchor = await extractAnchorFromSelection(selection)

        const body = anchor && anchor.quote
        const hasSelectedText = anchor.quote.length

        const annotation: Annotation = {
            url: generateAnnotationUrl({ pageUrl, now: () => Date.now() }),
            body: hasSelectedText
                ? anchor.quote
                : videoTimeStampForComment && undefined,
            pageUrl,
            tags: [],
            lists: [],
            comment: hasSelectedText
                ? ''
                : videoTimeStampForComment
                ? videoTimeStampForComment
                : undefined,
            selector: hasSelectedText
                ? anchor
                : videoTimeStampForComment && undefined,
            pageTitle: title,
        }

        try {
            await Promise.all([
                params.annotationsCache.create(annotation, {
                    shouldShare: params.shouldShare,
                    shouldCopyShareLink: params.shouldShare,
                }),
                this.renderHighlight(
                    annotation,
                    ({ openInEdit, annotationUrl }) => {
                        params.inPageUI.showSidebar({
                            annotationUrl,
                            action: openInEdit
                                ? 'edit_annotation'
                                : 'show_annotation',
                        })
                    },
                ),
            ])
        } catch (err) {
            this.removeAnnotationHighlight(annotation.url)
            throw err
        }

        return annotation
    }

    renderHighlight = async (
        highlight: Highlight,
        onClick: AnnotationClickHandler,
        temporary = false,
    ) => {
        if (!highlight?.selector?.descriptor?.content) {
            return
        }

        const highlightsColor = await browser.storage.local.get(
            '@highlight-colors',
        )

        addEventListener('storage', (event) => {})
        onstorage = (event) => {}

        this.defaultHighlightColor = highlightsColor['@highlight-colors']

        const baseClass =
            styles[temporary ? 'memex-highlight-tmp' : 'memex-highlight']

        try {
            let highlightedElements = [] as HighlightElement[]
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

                highlightedElements = highlightRange(
                    range,
                    baseClass,
                    highlightsColor['@highlight-colors'],
                )
                // markRange({ range, cssClass: baseClass })

                for (let highlights of highlightedElements) {
                    if (highlights.parentNode.nodeName === 'A') {
                        highlights.style['color'] = '#0b0080'
                    }
                }

                this.attachEventListenersToNewHighlights(highlight, onClick)
                highlight.domElements = highlightedElements

                for (let highlights of highlight.domElements) {
                    if (highlights.parentNode.nodeName === 'A') {
                        highlights.style['color'] = '#0b0080'
                    }
                }
            })

            return highlight
        } catch (e) {
            Raven.captureException(e)
            // console.error(
            //     'MEMEX: Error during annotation anchoring/highlighting:',
            //     e,
            // )
            console.error(e)
            return highlight
        }
    }

    /**
     * Given an array of highlight objects, highlights all of them.
     */
    renderHighlights = async (
        highlights: Highlight[],
        onClick,
    ): Promise<Highlight[]> => {
        await Promise.all(
            highlights.map(async (highlight) => {
                await this.renderHighlight(highlight, onClick)
            }),
        )
        this.watchForReanchors(highlights, onClick)
        return highlights
    }

    watchForReanchors = (highlights: Highlight[], onClick) => {
        if (!this.observer) {
            // @ts-ignore
            const pdfViewer = globalThis.PDFViewerApplication?.pdfViewer

            if (pdfViewer) {
                this.observer = new MutationObserver(
                    debounce(() => this.reanchorer(highlights, onClick), 100),
                )
                this.observer.observe(pdfViewer.viewer, {
                    attributes: true,
                    attributeFilter: ['data-loaded'],
                    childList: true,
                    subtree: true,
                })
            }
        }
    }

    reanchorer = (highlights: Highlight[], onClick) => {
        const reanchors = highlights.filter(
            (h) => !document.body.contains(h.domElements?.pop() ?? null),
        )
        if (reanchors.length > 0) {
            this.renderHighlights(reanchors, onClick)
        }
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
            $highlight.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
        this.resetHighlightsStyles()
        this.removeSelectedHighlights(this.currentActiveHighlight)
        this.selectHighlight(annotation)
        this.scrollToHighlight(annotation)
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
        newHighlights.forEach((highlightEl: HTMLElement) => {
            highlightEl.dataset.annotation = highlight.url

            if (highlightEl.parentNode.nodeName === 'A') {
                highlightEl.style['color'] = '#0b0080'
            }

            const clickListener = async (e: MouseEvent) => {
                // Let anchors behave as normal
                const parentNode = (e.target as HTMLElement)?.parentNode
                if (
                    parentNode?.nodeName?.toLowerCase() === 'a' &&
                    (parentNode as HTMLAnchorElement)?.href.length
                ) {
                    return
                }

                e.preventDefault()
                if (!(e.target as HTMLElement).dataset.annotation) {
                    return
                }
                openSidebar({
                    annotationUrl: highlight.url,
                    openInEdit: e.getModifierState('Shift'),
                })
                // make sure to remove all other selections before selecting the new one
                this.resetHighlightsStyles()
                this.selectHighlight(highlight)
            }

            highlightEl.addEventListener('click', clickListener, false)

            const mouseenterListener = (e) => {
                if (
                    !e.target.dataset.annotation ||
                    e.target.dataset.annotation === this.currentActiveHighlight
                ) {
                    return
                } else {
                    this.hoverOverHighlight(highlight)
                }
            }
            highlightEl.addEventListener(
                'mouseenter',
                mouseenterListener,
                false,
            )

            const mouseleaveListener = (e) => {
                if (
                    !e.target.dataset.annotation ||
                    e.target.dataset.annotation === this.currentActiveHighlight
                ) {
                    return
                }
                this.removeHoveredHighlights(highlight)
            }
            highlightEl.addEventListener(
                'mouseleave',
                mouseleaveListener,
                false,
            )
        })
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
    hoverOverHighlight = ({ url }: Highlight) => {
        // Make the current annotation as a "medium" highlight.
        const baseClass = styles['memex-highlight']
        const highlights = document.querySelectorAll(
            `.${baseClass}[data-annotation="${url}"]`,
        )

        highlights.forEach((highlight: HTMLElement) => {
            highlight.classList.add('hoveredHighlight')

            if (!highlight.classList.contains('selectedHighlight')) {
                highlight.style['background-color'] =
                    this.defaultHighlightColor + '80'
            }
        })
    }

    /**
     * Removes the medium class from all the highlights making them light.
     */

    removeHoveredHighlights = ({ url }: Highlight) => {
        const baseClass = styles['memex-highlight']
        const highlights = document.querySelectorAll(
            `.${baseClass}[data-annotation="${url}"]`,
        )
        highlights.forEach((highlight: HTMLElement) => {
            if (!highlight.classList.contains('selectedHighlight')) {
                highlight.classList.remove('hoveredHighlight')
                highlight.style['background-color'] = this.defaultHighlightColor
            }
        })
    }

    /**
     * Makes the highlight a dark highlight.
     */
    selectHighlight = ({ url }: Highlight) => {
        this.currentActiveHighlight = url
        const highlights = document.querySelectorAll(
            `[data-annotation="${url}"]`,
        )
        highlights.forEach((highlight: HTMLElement) => {
            highlight.classList.add('selectedHighlight')
            highlight.style['background-color'] =
                this.defaultHighlightColor + '80'
            highlight.style['border-bottom'] =
                '2px solid' + this.defaultHighlightColor
        })
    }

    removeSelectedHighlights = (url) => {
        const highlights = document.querySelectorAll(
            `[data-annotation="${url}"]`,
        )
        highlights.forEach((highlight: HTMLElement) => {
            if (highlight.classList.contains('selectedHighlight')) {
                highlight.classList.remove('selectedHighlight')
                highlight.style['background-color'] = this.defaultHighlightColor
                highlight.style['border-bottom'] = 'unset'
            }
        })
        this.currentActiveHighlight = ''
    }

    /**
     * Return highlights to normal state
     */
    resetHighlightsStyles = () => {
        const highlights = document.querySelectorAll(`[data-annotation]`)
        console.log(highlights)
        highlights.forEach((highlight: HTMLElement) => {
            console.log(highlight.getAttribute('data-annotation'))
            console.log(this.currentActiveHighlight)
            if (
                highlight.getAttribute('data-annotation') ===
                this.currentActiveHighlight
            ) {
                console.log('hat functioniert')
                return
            } else {
                highlight.classList.remove('selectedHighlight')
                highlight.style['background-color'] = this.defaultHighlightColor
                highlight.style['border-bottom'] = 'unset'
            }
        })
    }

    undoAllHighlights = this.resetHighlightsStyles

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

    removeAnnotationHighlights = (urls: string[]) =>
        urls.forEach(this.removeAnnotationHighlight)

    /**
     * Removes the highlights of a given annotation.
     */
    removeAnnotationHighlight = (url: string) => {
        const baseClass = styles['memex-highlight']
        const highlights = document.querySelectorAll(
            `.${baseClass}[data-annotation="${url}"]`,
        )
        highlights.forEach((highlight) => this._removeHighlight(highlight))
    }

    undoHighlight = this.removeAnnotationHighlight
}
