import browser from 'webextension-polyfill'
import throttle from 'lodash/throttle'
import hexToRgb from 'hex-to-rgb'

import type {
    Anchor,
    HighlightElement,
    SaveAndRenderHighlightDeps,
    HighlightInteractionsInterface,
    _UnifiedAnnotation as UnifiedAnnotation,
} from 'src/highlighting/types'
import type { AnnotationClickHandler } from 'src/highlighting/ui/types'
import { retryUntil } from 'src/util/retry-until'
import * as Raven from 'src/util/raven'
import type { Annotation } from 'src/annotations/types'
import {
    generateAnnotationUrl,
    shareOptsToPrivacyLvl,
} from 'src/annotations/utils'
import { reshapeAnnotationForCache } from 'src/annotations/cache/utils'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { AnnotationInterface } from 'src/annotations/background/types'
import { DEFAULT_HIGHLIGHT_COLOR, HIGHLIGHT_COLOR_KEY } from '../constants'
import { createAnnotation } from 'src/annotations/annotation-save-logic'
import { UNDO_HISTORY } from 'src/constants'
import { pageActionAllowed } from 'src/util/subscriptions/storage'
import delay from 'src/util/delay'
import { isUrlPDFViewerUrl } from 'src/pdf/util'
const styles = require('src/highlighting/ui/styles.css')

import { getHTML5VideoTimestamp } from '@worldbrain/memex-common/lib/editor/utils'
import { getSelectionHtml } from '@worldbrain/memex-common/lib/annotations/utils'
import * as anchoring from '@worldbrain/memex-common/lib/annotations'
import { highlightRange } from '@worldbrain/memex-common/lib/annotations/anchoring/highlighter'
import { findPage as findPdfPage } from '@worldbrain/memex-common/lib/annotations/anchoring/pdf.js'

const createHighlightClass = ({
    unifiedId,
}: Pick<UnifiedAnnotation, 'unifiedId'>): string =>
    `memex-cache-highlight-${unifiedId}`

export const extractAnchorFromSelection = async (
    selection: Selection,
    pageUrl: string,
): Promise<Anchor> => {
    const quote = getSelectionHtml(selection)
    const isPdf = isUrlPDFViewerUrl(window.location.href, {
        runtimeAPI: browser.runtime,
    })
    const descriptor = await anchoring.selectionToDescriptor({
        selection,
        isPdf,
    })
    return {
        quote,
        descriptor,
    }
}

export interface HighlightRendererDeps {
    annotationsBG: AnnotationInterface<'caller'>
    contentSharingBG: ContentSharingInterface
}

export class HighlightRenderer implements HighlightInteractionsInterface {
    private observer: MutationObserver[] = []
    private highlightColor = DEFAULT_HIGHLIGHT_COLOR
    private currentActiveHighlight: UnifiedAnnotation

    constructor(private deps: HighlightRendererDeps) {
        document.addEventListener('click', this.handleOutsideHighlightClick)

        browser.storage.onChanged.addListener((changes) => {
            if (changes[HIGHLIGHT_COLOR_KEY]?.newValue != null) {
                this.highlightColor = changes[HIGHLIGHT_COLOR_KEY].newValue
            }
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

        if (this.currentActiveHighlight != null) {
            this.removeSelectedHighlights(this.currentActiveHighlight)
        }
    }

    saveAndRenderHighlightAndEditInSidebar: HighlightInteractionsInterface['saveAndRenderHighlightAndEditInSidebar'] = async (
        params,
    ) => {
        const annotationCacheId = await this._saveAndRenderHighlight(params)

        if (annotationCacheId) {
            await params.inPageUI.showSidebar({
                annotationCacheId,
                action: params.showSpacePicker
                    ? 'edit_annotation_spaces'
                    : 'edit_annotation',
            })
        } else {
            await params.inPageUI.showSidebar({ action: 'comment' })
        }
    }

    private createUndoHistoryEntry = async (
        url: string,
        type: 'annotation' | 'pagelistEntry',
        id: string,
    ) => {
        let undoHistory = await browser.storage.local.get(`${UNDO_HISTORY}`)

        undoHistory = undoHistory[`${UNDO_HISTORY}`]

        if (undoHistory == null) {
            undoHistory = []
        }

        const undoEntry = { url: url, type: type, id: id }

        undoHistory.unshift(undoEntry)

        await globalThis['browser'].storage.local.set({
            [UNDO_HISTORY]: undoHistory,
        })
    }

    saveAndRenderHighlight: HighlightInteractionsInterface['saveAndRenderHighlight'] = async (
        params,
    ) => {
        await this._saveAndRenderHighlight(params)
    }

    private async _saveAndRenderHighlight(
        params: SaveAndRenderHighlightDeps,
    ): Promise<UnifiedAnnotation['unifiedId'] | null> {
        const allowed = await pageActionAllowed()

        if (allowed) {
            const selection = params.getSelection()
            const { fullPageUrl, title } = await params.getFullPageUrlAndTitle()

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

            let anchor

            if (selection && selection.anchorNode) {
                // Fix bug where you can't select Youtube context menu annotations twice

                const selectionItems =
                    selection.anchorNode.childNodes ?? undefined
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
                    anchor = await extractAnchorFromSelection(
                        selection,
                        fullPageUrl,
                    )
                }
            }

            const body = anchor ? anchor.quote : undefined
            const hasSelectedText =
                anchor && anchor.quote ? anchor.quote.length : false

            const localListIds: number[] = []
            if (params.inPageUI.selectedList) {
                const selectedList =
                    params.annotationsCache.lists.byId[
                        params.inPageUI.selectedList
                    ]
                if (selectedList.localId != null) {
                    localListIds.push(selectedList.localId)
                }
            }

            const now = new Date()
            const annotation: Annotation &
                Required<Pick<Annotation, 'createdWhen' | 'lastEdited'>> = {
                url: generateAnnotationUrl({
                    pageUrl: fullPageUrl,
                    now: () => Date.now(),
                }),
                body: hasSelectedText ? body : undefined,
                pageUrl: fullPageUrl,
                tags: [],
                lists: localListIds,
                comment: hasSelectedText
                    ? ''
                    : videoTimeStampForComment
                    ? videoTimeStampForComment
                    : undefined,
                selector: hasSelectedText
                    ? anchor
                    : videoTimeStampForComment && undefined,
                pageTitle: title,
                createdWhen: now,
                lastEdited: now,
            }

            try {
                const cacheAnnotation = reshapeAnnotationForCache(annotation, {
                    extraData: {
                        creator: params.currentUser,
                        privacyLevel: shareOptsToPrivacyLvl({
                            shouldShare: params.shouldShare,
                        }),
                    },
                })
                const { unifiedId } = params.annotationsCache.addAnnotation(
                    cacheAnnotation,
                )

                window.getSelection().empty()

                await this.renderHighlight(
                    { ...cacheAnnotation, unifiedId },
                    ({ openInEdit, unifiedAnnotationId }) => {
                        params.inPageUI.showSidebar({
                            annotationCacheId: unifiedAnnotationId,
                            action: openInEdit
                                ? 'edit_annotation'
                                : 'show_annotation',
                        })
                    },
                )

                await this.createUndoHistoryEntry(
                    window.location.href,
                    'annotation',
                    unifiedId,
                )

                try {
                    await createAnnotation({
                        annotationData: {
                            fullPageUrl,
                            localListIds,
                            pageTitle: title,
                            body: annotation.body,
                            selector: annotation.selector,
                            comment: annotation.comment,
                            localId: annotation.url,
                            createdWhen: now,
                        },
                        shareOpts: {
                            shouldShare: params.shouldShare,
                            shouldCopyShareLink: params.shouldShare,
                        },
                        annotationsBG: this.deps.annotationsBG,
                        contentSharingBG: this.deps.contentSharingBG,
                        skipPageIndexing: false,
                    })
                } catch (err) {
                    this.removeAnnotationHighlight(unifiedId)
                    throw err
                }
                return unifiedId
            } catch (err) {
                this.removeAnnotationHighlight(annotation.url)
                throw err
            }
        }
    }

    renderHighlight: HighlightInteractionsInterface['renderHighlight'] = async (
        highlight,
        onClick,
        temporary = false,
    ) => {
        let highlightAnchored = false
        let highlightColor = this.highlightColor
        if (!highlight?.selector?.descriptor?.content) {
            return
        }

        const isPdf = isUrlPDFViewerUrl(window.location.href, {
            runtimeAPI: browser.runtime,
        })
        const baseClass = styles['memex-highlight']

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
                    () => anchoring.descriptorToRange({ descriptor, isPdf }),
                    (range) => range !== null,
                    {
                        intervalMiliseconds: 1000,
                        timeoutMiliseconds: 5000,
                    },
                )

                highlightedElements = highlightRange(
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
                    this.attachEventListenersToNewHighlights(highlight, onClick)
                }

                if (highlightedElements && highlightedElements.length > 0) {
                    highlightAnchored = true
                    this.watchForRerenders([highlight], onClick)
                    return true
                } else {
                    return false
                }
            })

            // return highlight
        } catch (e) {
            Raven.captureException(e)
            // console.error(
            //     'MEMEX: Error during annotation anchoring/highlighting:',
            //     e,
            // )
            console.error(e)
            // return highlight
        } finally {
            if (highlightAnchored) {
                return true
            } else {
                return false
            }
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
        const {
            [HIGHLIGHT_COLOR_KEY]: highlightsColor,
        } = await browser.storage.local.get({
            [HIGHLIGHT_COLOR_KEY]: DEFAULT_HIGHLIGHT_COLOR,
        })
        const pdfViewer = globalThis.PDFViewerApplication?.pdfViewer

        this.highlightColor = hexToRgb(highlightsColor).toString()

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
                    opts?.temp,
                )

                if (!pdfViewer) {
                    let attempt = 0
                    while (!highlightAnchored && attempt < 10) {
                        attempt++

                        highlightAnchored = await this.renderHighlight(
                            highlight,
                            onClick,
                            opts?.temp,
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
                            opts?.temp,
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
        highlights: UnifiedAnnotation[],
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
                this.observer[highlight.unifiedId] = new MutationObserver(
                    throttle(rerenderMissingHighlights, 300, { leading: true }),
                )
                const highlightElement = document.querySelector(
                    `.${createHighlightClass(highlight)}`,
                )
                this.observer[highlight.unifiedId].observe(highlightElement, {
                    attributes: false,
                    childList: true,
                    subtree: false,
                })
            })
        }
    }

    private scrollToHighlight = async ({
        unifiedId,
        selector,
    }: UnifiedAnnotation) => {
        const baseClass = styles['memex-highlight']
        const $highlight = document.querySelector(
            `.${baseClass}[data-annotation="${unifiedId}"]`,
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
    private scrollCardIntoView = ({ unifiedId }: UnifiedAnnotation) => {
        const baseClass = 'AnnotationBox'
        const highlights = document.getElementById('memex-sidebar-container')

        const highlight = highlights.shadowRoot.getElementById(unifiedId)

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
        if (this.currentActiveHighlight) {
            this.removeSelectedHighlights(this.currentActiveHighlight)
        }
        this.selectHighlight(annotation)
        await this.scrollToHighlight(annotation)
    }

    /**
     * Attaches event listeners to the highlights for hovering/focusing on the
     * annotation in sidebar.
     */
    private attachEventListenersToNewHighlights = (
        highlight: UnifiedAnnotation,
        openSidebar: AnnotationClickHandler,
    ) => {
        const newHighlights = document.querySelectorAll(
            `.${styles['memex-highlight']}:not([data-annotation])`,
        )

        newHighlights.forEach((highlightEl: HTMLElement) => {
            this.currentActiveHighlight = highlight
            highlightEl.dataset.annotation = highlight.unifiedId

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
                openSidebar({
                    unifiedAnnotationId: highlight.unifiedId,
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
                        this.currentActiveHighlight?.unifiedId
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
                        this.currentActiveHighlight?.unifiedId
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

    private hoverOverHighlight = ({ unifiedId }: UnifiedAnnotation) => {
        // Make the current annotation as a "medium" highlight.
        const baseClass = styles['memex-highlight']
        const highlights = document.querySelectorAll(
            `.${baseClass}[data-annotation="${unifiedId}"]`,
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
    private removeHoveredHighlights = ({ unifiedId }: UnifiedAnnotation) => {
        const baseClass = styles['memex-highlight']
        const highlights = document.querySelectorAll(
            `.${baseClass}[data-annotation="${unifiedId}"]`,
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
    private selectHighlight = (annotation: UnifiedAnnotation) => {
        this.currentActiveHighlight = annotation
        const highlights = document.querySelectorAll(
            `[data-annotation="${annotation.unifiedId}"]`,
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

    private removeSelectedHighlights = ({ unifiedId }: UnifiedAnnotation) => {
        const highlights = document.querySelectorAll(
            `[data-annotation="${unifiedId}"]`,
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
        this.currentActiveHighlight = null
    }
    /**
     * Return highlights to normal state
     */
    resetHighlightsStyles: HighlightInteractionsInterface['resetHighlightsStyles'] = () => {
        const highlights = document.querySelectorAll(`[data-annotation]`)
        highlights.forEach((highlight: HTMLElement) => {
            if (
                highlight.getAttribute('data-annotation') ===
                this.currentActiveHighlight?.unifiedId
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
    removeAnnotationHighlight: HighlightInteractionsInterface['removeAnnotationHighlight'] = (
        unifiedId,
    ) => {
        const baseClass = styles['memex-highlight']
        const highlights = document.querySelectorAll(
            `.${baseClass}[data-annotation="${unifiedId}"]`,
        )
        highlights.forEach((highlight) => this._removeHighlight(highlight))
    }
}
