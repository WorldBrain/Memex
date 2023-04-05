import throttle from 'lodash/throttle'

import type {
    Anchor,
    UndoHistoryEntry,
    RenderableAnnotation,
    AnnotationClickHandler,
    SaveAndRenderHighlightDeps,
    HighlightInteractionsInterface,
} from 'src/highlighting/types'
import { getHTML5VideoTimestamp } from '@worldbrain/memex-common/lib/editor/utils'
import { retryUntil } from '@worldbrain/memex-common/lib/utils/retry-until'
import delay from '@worldbrain/memex-common/lib/utils/delay'
import { getSelectionHtml } from '@worldbrain/memex-common/lib/annotations/utils'
import { DEFAULT_HIGHLIGHT_COLOR } from '@worldbrain/memex-common/lib/annotations/constants'
import * as anchoring from '@worldbrain/memex-common/lib/annotations'
import { highlightRange } from '@worldbrain/memex-common/lib/annotations/anchoring/highlighter'
import { findPage as findPdfPage } from '@worldbrain/memex-common/lib/annotations/anchoring/pdf.js'
import type { AnnotationCreateData } from '@worldbrain/memex-common/lib/annotations/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
const styles = require('src/highlighting/ui/styles.css')

const createHighlightClass = ({ id }: RenderableAnnotation): string =>
    `memex-highlight-${id}`

export interface HighlightRendererDeps {
    captureException: (err: Error) => void
    getUndoHistory: () => Promise<UndoHistoryEntry[]>
    setUndoHistory: (history: UndoHistoryEntry[]) => Promise<void>
    getHighlightColorRGB: () => Promise<string>
    onHighlightColorChange: (cb: (nextColor: string) => void) => void
    scheduleAnnotationCreation: (
        annotationData: AnnotationCreateData,
    ) => { annotationId: AutoPk; createPromise: Promise<void> }
}

export class HighlightRenderer implements HighlightInteractionsInterface {
    private observer: MutationObserver[] = []
    private highlightColor = DEFAULT_HIGHLIGHT_COLOR
    private activeHighlight: RenderableAnnotation

    constructor(private deps: HighlightRendererDeps) {
        document.addEventListener('click', this.handleOutsideHighlightClick)

        deps.onHighlightColorChange((nextColor) => {
            this.highlightColor = nextColor
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

        if (this.activeHighlight != null) {
            this.removeSelectedHighlights(this.activeHighlight)
        }
    }

    saveAndRenderHighlightAndEditInSidebar: HighlightInteractionsInterface['saveAndRenderHighlightAndEditInSidebar'] = async (
        params,
    ) => {
        const annotationId = await this._saveAndRenderHighlight(params)

        if (annotationId) {
            await params.inPageUI.showSidebar({
                annotationCacheId: annotationId.toString(),
                action: params.showSpacePicker
                    ? 'edit_annotation_spaces'
                    : 'edit_annotation',
            })
        } else {
            await params.inPageUI.showSidebar({ action: 'comment' })
        }
    }

    saveAndRenderHighlight: HighlightInteractionsInterface['saveAndRenderHighlight'] = async (
        params,
    ) => {
        await this._saveAndRenderHighlight(params)
    }

    private async _saveAndRenderHighlight(
        params: SaveAndRenderHighlightDeps,
    ): Promise<AutoPk | null> {
        const selection = params.getSelection()
        const fullPageUrl = await params.getFullPageUrl()

        // TODO: simplify conditions related to timestamp + annot data. Quite difficult to work thru and reason about. i.e., bug prone
        // Enable support for any kind of HTML 5 video using annotation keyboard shortcuts to make notes without opening the sidebar and notes field first
        let videoTimeStampForComment: string | null
        const [videoURLWithTime, humanTimestamp] = getHTML5VideoTimestamp()

        if (videoURLWithTime != null) {
            videoTimeStampForComment = `<a class="youtubeTimestamp" href="${videoURLWithTime}">${humanTimestamp}</a>`
        }

        if (
            (!selection || selection.isCollapsed) &&
            videoTimeStampForComment == null
        ) {
            return null
        }

        let anchor: Anchor

        if (selection && selection.anchorNode) {
            // Fix bug where you can't select Youtube context menu annotations twice
            const selectionItems = selection.anchorNode.childNodes ?? undefined
            const lastSelectionItem = selectionItems[
                selectionItems.length - 1
            ] as HTMLElement

            if (
                (lastSelectionItem &&
                    lastSelectionItem.classList &&
                    lastSelectionItem.classList.contains('ytp-popup')) ||
                (selection.toString().length === 0 &&
                    fullPageUrl.includes('youtube.com/watch'))
            ) {
                anchor = undefined
            } else {
                const quote = getSelectionHtml(selection)
                const descriptor = await anchoring.selectionToDescriptor({
                    isPdf: params.isPdf,
                    selection,
                })
                anchor = { quote, descriptor }
            }
        }

        const now = new Date()

        // TODO: Clean up all these conditions surrounding selector, body, comment fields
        const body = anchor ? anchor.quote : undefined
        const hasSelectedText =
            anchor && anchor.quote ? anchor.quote.length : false
        const selector = hasSelectedText
            ? anchor
            : videoTimeStampForComment && undefined

        const {
            annotationId,
            createPromise,
        } = this.deps.scheduleAnnotationCreation({
            fullPageUrl,
            body: hasSelectedText ? body : undefined,
            comment: hasSelectedText
                ? ''
                : videoTimeStampForComment
                ? videoTimeStampForComment
                : undefined,
            selector,
            shouldShare: params.shouldShare,
            creator: params.currentUser,
            createdWhen: now.getTime(),
            updatedWhen: now.getTime(),
        })

        try {
            window.getSelection().empty()

            await this.renderHighlight(
                { id: annotationId, selector },
                ({ openInEdit, annotationId }) => {
                    params.inPageUI.showSidebar({
                        annotationCacheId: annotationId.toString(),
                        action: openInEdit
                            ? 'edit_annotation'
                            : 'show_annotation',
                    })
                },
            )

            await this.createUndoHistoryEntry(
                window.location.href,
                'annotation',
                annotationId,
            )

            await createPromise
            return annotationId
        } catch (err) {
            this.removeAnnotationHighlight({ id: annotationId })
            throw err
        }
    }

    private createUndoHistoryEntry = async (
        url: string,
        type: 'annotation' | 'pagelistEntry',
        id: AutoPk,
    ) => {
        const undoHistory = await this.deps.getUndoHistory()
        undoHistory.unshift({ url, type, id })
        await this.deps.setUndoHistory(undoHistory)
    }

    renderHighlight: HighlightInteractionsInterface['renderHighlight'] = async (
        highlight,
        onClick,
        { isPdf } = {},
    ) => {
        let wasHighlightAnchored = false
        const highlightColor = this.highlightColor
        if (!highlight?.selector?.descriptor?.content) {
            return false
        }

        const baseClass = styles['memex-highlight']

        try {
            const descriptor = highlight.selector.descriptor

            const range = await retryUntil(
                () => anchoring.descriptorToRange({ descriptor, isPdf }),
                (range) => range !== null,
                {
                    intervalMiliseconds: 1000,
                    timeoutMiliseconds: 5000,
                },
            )

            const highlightedElements = highlightRange(
                range,
                baseClass,
                highlightColor,
            )
            // markRange({ range, cssClass: baseClass })

            for (let highlightEl of highlightedElements) {
                highlightEl.classList.add(createHighlightClass(highlight))
                highlightEl.style.setProperty(
                    '--defaultHighlightColorCSS',
                    this.highlightColor,
                )

                if (highlightEl.parentNode.nodeName === 'A') {
                    highlightEl.style['color'] = '#3366cc'
                }
            }

            if (highlightedElements.length) {
                this.attachMouseEventListenersToNewHighlights(
                    highlight,
                    onClick,
                )
            }

            if (highlightedElements && highlightedElements.length > 0) {
                wasHighlightAnchored = true
                this.watchForRerenders([highlight], onClick)
            }
        } catch (e) {
            this.deps.captureException(e)
            console.error(e)
        } finally {
            return wasHighlightAnchored
        }
    }

    /**
     * Given an array of highlight objects, highlights all of them.
     */
    renderHighlights: HighlightInteractionsInterface['renderHighlights'] = async (
        highlights,
        onClick,
        opts,
    ) => {
        const pdfViewer = globalThis.PDFViewerApplication?.pdfViewer
        this.highlightColor = await this.deps.getHighlightColorRGB()

        if (opts?.removeExisting) {
            this.removeAllHighlights()
        }

        if (!highlights.length) {
            return
        }

        await Promise.all(
            highlights.map(async (highlight) => {
                let highlightAnchored = await this.renderHighlight(
                    highlight,
                    onClick,
                    opts,
                )

                if (!pdfViewer) {
                    let attempt = 0
                    while (!highlightAnchored && attempt < 10) {
                        attempt++

                        highlightAnchored = await this.renderHighlight(
                            highlight,
                            onClick,
                            opts,
                        )

                        await delay(500)
                    }

                    while (
                        !highlightAnchored &&
                        attempt >= 10 &&
                        attempt <= 100
                    ) {
                        attempt++
                        highlightAnchored = await this.renderHighlight(
                            highlight,
                            onClick,
                            opts,
                        )

                        await delay(2000)
                    }
                }
            }),
        )

        if (
            highlights.length > 0 &&
            pdfViewer &&
            !opts?.dontWatchForRerenders
        ) {
            this.watchForRerenders(highlights, onClick)
        }
    }

    // PDFjs viewer un/loads pages as you scroll through larger docs, thus highlights need to be checked and re-rendered
    private watchForRerenders = (
        highlights: RenderableAnnotation[],
        onClick: AnnotationClickHandler,
    ) => {
        const pdfViewer = globalThis.PDFViewerApplication?.pdfViewer

        if (!pdfViewer) {
            return
        }

        const rerenderMissingHighlights = async () => {
            let highlightsToRerender
            if (pdfViewer) {
                highlightsToRerender = highlights.filter(
                    (highlight) =>
                        document.querySelector(
                            `.${createHighlightClass(highlight)}`,
                        ) == null,
                )
            } else {
                highlightsToRerender = highlights.filter(
                    (highlight) =>
                        document.querySelector(
                            `.${createHighlightClass(highlight)}`,
                        ) == null ||
                        document.querySelector(
                            `.${createHighlightClass(highlight)}`,
                        ).innerHTML.length === 0,
                )
            }

            if (highlightsToRerender.length > 0) {
                await this.renderHighlights(highlightsToRerender, onClick, {
                    removeExisting: false,
                    dontWatchForRerenders: true,
                })
            }
        }

        // TODO: can we limit the scope of what's being observed here?

        if (pdfViewer) {
            this.observer[1] = new MutationObserver(
                throttle(rerenderMissingHighlights, 300, { leading: true }),
            )
            this.observer[1].observe(pdfViewer.viewer, {
                attributeFilter: ['data-loaded'],
                attributes: true,
                childList: true,
                subtree: true,
            })
        } else {
            highlights.map((highlight) => {
                this.observer[highlight.id] = new MutationObserver(
                    throttle(rerenderMissingHighlights, 300, { leading: true }),
                )
                const highlightElement = document.querySelector(
                    `.${createHighlightClass(highlight)}`,
                )
                this.observer[highlight.id].observe(highlightElement, {
                    attributes: false,
                    childList: true,
                    subtree: false,
                })
            })
        }
    }

    private scrollToHighlight = async ({
        id,
        selector,
    }: RenderableAnnotation) => {
        const baseClass = styles['memex-highlight']
        const $highlight = document.querySelector(
            `.${baseClass}[data-annotation="${id}"]`,
        ) as HTMLElement

        if ($highlight) {
            $highlight.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else {
            console.error('MEMEX: Oops, no highlight found to scroll to')
        }

        const pdfViewer = globalThis.PDFViewerApplication
        if (!pdfViewer) {
            return
        }
        const position = selector?.descriptor.content.find(
            (s) => s.type === 'TextPositionSelector',
        )
        if (position?.start == null) {
            return
        }

        const { index: pageIndex } = await findPdfPage(position.start)
        if (pageIndex != null && pdfViewer.page !== pageIndex + 1) {
            pdfViewer.page = pageIndex + 1
        }
    }

    /**
     * Scrolls the annotation card into ivew of the given annotation on the current page.
     */
    private scrollCardIntoView = ({ id }: RenderableAnnotation) => {
        const baseClass = 'AnnotationBox'
        const highlights = document.getElementById('memex-sidebar-container')

        const highlight = highlights.shadowRoot.getElementById(id.toString())

        highlight?.scrollIntoView({ behavior: 'smooth', block: 'center' })

        // for (let item of highlights) {
        //     console.log('item')
        //     if (item.getAttribute('key') === url) {
        //         console.log('scrollup')
        //         item.scrollIntoView({ behavior: 'smooth', block: 'center' })
        //     }
        // }
    }
    /**
     * Given an annotation object, highlights that text and removes other highlights
     * from the page.
     */
    highlightAndScroll: HighlightInteractionsInterface['highlightAndScroll'] = async (
        annotation,
    ) => {
        this.removeSelectedHighlights(annotation)
        this.resetHighlightsStyles()
        if (this.activeHighlight) {
            this.removeSelectedHighlights(this.activeHighlight)
        }
        this.selectHighlight(annotation)
        await this.scrollToHighlight(annotation)
    }

    /**
     * Attaches event listeners to the highlights for hovering/focusing on the
     * annotation in sidebar.
     */
    private attachMouseEventListenersToNewHighlights = (
        highlight: RenderableAnnotation,
        onClick: AnnotationClickHandler,
    ) => {
        const newHighlights = document.querySelectorAll(
            `.${styles['memex-highlight']}:not([data-annotation])`,
        )

        newHighlights.forEach((highlightEl: HTMLElement) => {
            this.activeHighlight = highlight
            highlightEl.dataset.annotation = highlight.id.toString()

            if (highlightEl.parentNode.nodeName === 'A') {
                highlightEl.style['color'] = '#3366cc'
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
                onClick({
                    annotationId: highlight.id,
                    openInEdit: e.getModifierState('Shift'),
                })
                // make sure to remove all other selections before selecting the new one
                this.resetHighlightsStyles()
                this.selectHighlight(highlight)
                this.scrollCardIntoView(highlight)
            }

            highlightEl.addEventListener('click', clickListener, false)

            const mouseenterListener = (e: MouseEvent) => {
                if (
                    !(e.target as HTMLElement).dataset?.annotation ||
                    (e.target as HTMLElement).dataset?.annotation ===
                        this.activeHighlight?.id
                ) {
                    return
                }
                this.hoverOverHighlight(highlight)
            }
            highlightEl.addEventListener(
                'mouseenter',
                mouseenterListener,
                false,
            )

            const mouseleaveListener = (e: MouseEvent) => {
                if (
                    !(e.target as HTMLElement).dataset?.annotation ||
                    (e.target as HTMLElement).dataset?.annotation ===
                        this.activeHighlight?.id
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

    private removeHighlights = (baseClass: string) => {
        const prevHighlights = document.querySelectorAll(`.${baseClass}`)
        prevHighlights.forEach((highlight) => this._removeHighlight(highlight))
    }

    removeTempHighlights: HighlightInteractionsInterface['removeTempHighlights'] = () => {
        this.removeHighlights(styles['memex-highlight-tmp'])
    }

    private removeAllHighlights = () => {
        this.removeHighlights(styles['memex-highlight'])
    }

    private hoverOverHighlight = ({ id }: RenderableAnnotation) => {
        // Make the current annotation as a "medium" highlight.
        const baseClass = styles['memex-highlight']
        const highlights = document.querySelectorAll(
            `.${baseClass}[data-annotation="${id}"]`,
        )

        highlights.forEach((highlight: HTMLElement) => {
            highlight.classList.add(styles['hoveredHighlight'])

            if (!highlight.classList.contains('selectedHighlight')) {
                highlight.style.setProperty(
                    '--defaultHighlightColorCSS',
                    this.highlightColor,
                )
            }
        })
    }

    /**
     * Removes the medium class from all the highlights making them light.
     */
    private removeHoveredHighlights = ({ id }: RenderableAnnotation) => {
        const baseClass = styles['memex-highlight']
        const highlights = document.querySelectorAll(
            `.${baseClass}[data-annotation="${id}"]`,
        )
        highlights.forEach((highlight: HTMLElement) => {
            if (!highlight.classList.contains(styles['selectedHighlight'])) {
                highlight.classList.remove(styles['hoveredHighlight'])
                // highlight.style['background-color'] = this.defaultHighlightColor
                highlight.style.setProperty(
                    '--defaultHighlightColorCSS',
                    this.highlightColor,
                )
            }
        })
    }

    /**
     * Makes the highlight a dark highlight.
     */
    private selectHighlight = (annotation: RenderableAnnotation) => {
        this.activeHighlight = annotation
        const highlights = document.querySelectorAll(
            `[data-annotation="${annotation.id}"]`,
        )

        highlights.forEach((highlight: HTMLElement) => {
            highlight.classList.add(styles['selectedHighlight'])
            highlight.classList.remove(styles['hoveredHighlight'])
            highlight.style.setProperty(
                '--defaultHighlightColorCSS',
                this.highlightColor,
            )
        })
    }

    private removeSelectedHighlights = ({ id }: RenderableAnnotation) => {
        const highlights = document.querySelectorAll(
            `[data-annotation="${id}"]`,
        )
        highlights.forEach((highlight: HTMLElement) => {
            if (highlight.classList.contains(styles['selectedHighlight'])) {
                highlight.classList.remove(styles['selectedHighlight'])
                highlight.style.setProperty(
                    '--defaultHighlightColorCSS',
                    this.highlightColor,
                )
                // highlight.style['background-color'] = this.defaultHighlightColor
                // highlight.style['border-bottom'] = 'unset'
            }
        })
        this.activeHighlight = null
    }
    /**
     * Return highlights to normal state
     */
    resetHighlightsStyles: HighlightInteractionsInterface['resetHighlightsStyles'] = () => {
        const highlights = document.querySelectorAll(`[data-annotation]`)
        highlights.forEach((highlight: HTMLElement) => {
            if (
                highlight.getAttribute('data-annotation') ===
                this.activeHighlight?.id
            ) {
                highlight.classList.remove(styles['selectedHighlight'])
                highlight.style.setProperty(
                    '--defaultHighlightColorCSS',
                    this.highlightColor,
                )
            } else {
                highlight.classList.remove(styles['selectedHighlight'])
                highlight.style.setProperty(
                    '--defaultHighlightColorCSS',
                    this.highlightColor,
                )
            }
        })
    }

    /**
     * Unwraps the `memex-highlight` element from the highlight,
     * resetting the DOM Text to how it was.
     */
    private _removeHighlight = (highlight: Element) => {
        const parent = highlight.parentNode
        while (highlight.firstChild) {
            parent.insertBefore(highlight.firstChild, highlight)
        }
        parent.removeChild(highlight)
    }

    /**
     * Removes the highlights of a given annotation.
     */
    removeAnnotationHighlight: HighlightInteractionsInterface['removeAnnotationHighlight'] = ({
        id,
    }) => {
        const baseClass = styles['memex-highlight']
        const highlights = document.querySelectorAll(
            `.${baseClass}[data-annotation="${id}"]`,
        )
        highlights.forEach((highlight) => this._removeHighlight(highlight))
    }
}
