import analytics from 'src/analytics'

import type {
    Anchor,
    HighlightElement,
    SaveAndRenderHighlightDeps,
    HighlightInteractionsInterface,
    _UnifiedAnnotation as UnifiedAnnotation,
} from 'src/highlighting/types'
import type { AnnotationClickHandler } from 'src/highlighting/ui/types'
import { retryUntil } from 'src/util/retry-until'
import { descriptorToRange } from './anchoring/index'
import * as Raven from 'src/util/raven'
import type { Annotation } from 'src/annotations/types'
import * as anchoring from 'src/highlighting/ui/anchoring'
import {
    generateAnnotationUrl,
    shareOptsToPrivacyLvl,
} from 'src/annotations/utils'
import { highlightRange } from 'src/highlighting/ui/anchoring/highlighter'
import { getHTML5VideoTimestamp } from '@worldbrain/memex-common/lib/editor/utils'
import { reshapeAnnotationForCache } from 'src/annotations/cache/utils'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { AnnotationInterface } from 'src/annotations/background/types'
import browser from 'webextension-polyfill'
import { findPage as findPdfPage } from 'src/highlighting/ui/anchoring/anchoring/pdf.js'
import throttle from 'lodash/throttle'
import hexToRgb from 'hex-to-rgb'
import { DEFAULT_HIGHLIGHT_COLOR, HIGHLIGHT_COLOR_KEY } from '../constants'
import { createAnnotation } from 'src/annotations/annotation-save-logic'
import { UNDO_HISTORY } from 'src/constants'
import { getSelectionHtml } from '@worldbrain/memex-common/lib/annotations/utils'
const styles = require('src/highlighting/ui/styles.css')

const createHighlightClass = ({
    unifiedId,
}: Pick<UnifiedAnnotation, 'unifiedId'>): string =>
    `memex-cache-highlight-${unifiedId}`

export const extractAnchorFromSelection = async (
    selection: Selection,
    pageUrl: string,
): Promise<Anchor> => {
    const quote2 = selection.toString()
    const quote = getSelectionHtml(selection)
    const descriptor = await anchoring.selectionToDescriptor({ selection })
    return {
        quote,
        descriptor,
    }
}

export type HighlightRendererInterface = HighlightInteractionsInterface & {
    undoHighlight: (uniqueUrl: string) => void
    undoAllHighlights: () => void
}

// // TODO: (sidebar-refactor) move to somewhere more highlight content script related
// export const renderAnnotationCacheChanges = ({
//     cacheChanges,
//     onClickHighlight,
//     renderer,
// }: {
//     cacheChanges: AnnotationCacheChangeEvents
//     onClickHighlight: AnnotationClickHandler
//     renderer: HighlightRenderInterface
// }) => {
//     const onRollback = (annotations) => {
//         renderer.undoAllHighlights()
//         renderer.renderHighlights(
//             annotations as Highlight[],
//             onClickHighlight,
//             false,
//         )
//     }
//     const onCreated = (annotation) => {
//         renderer.renderHighlight(annotation, onClickHighlight)
//     }
//     const onDeleted = (annotation) => {
//         renderer.undoHighlight(annotation.url)
//     }

//     cacheChanges.on('rollback', onRollback)
//     cacheChanges.on('created', onCreated)
//     cacheChanges.on('deleted', onDeleted)

//     return () => {
//         cacheChanges.removeListener('rollback', onRollback)
//         cacheChanges.removeListener('created', onCreated)
//         cacheChanges.removeListener('deleted', onDeleted)
//     }
// }

export interface HighlightRendererDependencies {}
export class HighlightRenderer implements HighlightRendererInterface {
    private observer: MutationObserver
    private highlightColor = DEFAULT_HIGHLIGHT_COLOR
    private currentActiveHighlight: UnifiedAnnotation

    constructor(
        private deps: {
            annotationsBG: AnnotationInterface<'caller'>
            contentSharingBG: ContentSharingInterface
        },
    ) {
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
        analytics.trackEvent(
            params.analyticsEvent ?? {
                category: 'Annotations',
                action: 'create',
            },
        )
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

    createUndoHistoryEntry = async (
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
    ): Promise<UnifiedAnnotation['unifiedId'] | null> {
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

            const selectionItems = selection.anchorNode.childNodes ?? undefined
            const lastSelectionItem = selectionItems[
                selectionItems.length - 1
            ] as HTMLElement

            if (
                lastSelectionItem &&
                lastSelectionItem.classList.contains('ytp-popup')
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
                params.annotationsCache.lists.byId[params.inPageUI.selectedList]
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

            return unifiedId
        } catch (err) {
            this.removeAnnotationHighlight(annotation.url)
            throw err
        }
    }

    renderHighlight: HighlightInteractionsInterface['renderHighlight'] = async (
        highlight,
        onClick,
        temporary = false,
    ) => {
        let highlightColor = this.highlightColor
        if (!highlight?.selector?.descriptor?.content) {
            return
        }

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
                    () => descriptorToRange({ descriptor }),
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
        this.highlightColor = hexToRgb(highlightsColor).toString()

        if (opts?.removeExisting) {
            this.removeAllHighlights()
        }

        if (!highlights.length) {
            return
        }

        await Promise.all(
            highlights.map(async (highlight) => {
                await this.renderHighlight(highlight, onClick, opts?.temp)
            }),
        )

        this.watchForRerenders(highlights, onClick)
    }

    // PDFjs viewer un/loads pages as you scroll through larger docs, thus highlights need to be checked and re-rendered
    private watchForRerenders = (
        highlights: UnifiedAnnotation[],
        onClick: AnnotationClickHandler,
    ) => {
        const pdfViewer = globalThis.PDFViewerApplication?.pdfViewer
        if (this.observer != null || !pdfViewer) {
            return
        }

        const rerenderMissingHighlights = async () => {
            const highlightsToRerender = highlights.filter(
                (highlight) =>
                    document.querySelector(
                        `.${createHighlightClass(highlight)}`,
                    ) == null,
            )

            if (highlightsToRerender.length > 0) {
                await this.renderHighlights(highlightsToRerender, onClick, {
                    removeExisting: false,
                })
            }
        }

        this.observer = new MutationObserver(
            throttle(rerenderMissingHighlights, 300, { leading: true }),
        )

        // TODO: can we limit the scope of what's being observed here?
        this.observer.observe(pdfViewer.viewer, {
            attributeFilter: ['data-loaded'],
            attributes: true,
            childList: true,
            subtree: true,
        })
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
    attachEventListenersToNewHighlights: HighlightInteractionsInterface['attachEventListenersToNewHighlights'] = (
        highlight,
        openSidebar,
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

    removeTempHighlights = () => {
        this.removeHighlights(styles['memex-highlight-tmp'])
    }

    removeAllHighlights = () => {
        this.removeHighlights(styles['memex-highlight'])
    }

    hoverOverHighlight: HighlightInteractionsInterface['hoverOverHighlight'] = ({
        unifiedId,
    }) => {
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
    removeHoveredHighlights: HighlightInteractionsInterface['removeHoveredHighlights'] = ({
        unifiedId,
    }) => {
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
    selectHighlight: HighlightInteractionsInterface['selectHighlight'] = (
        annotation,
    ) => {
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

    removeSelectedHighlights: HighlightInteractionsInterface['removeSelectedHighlights'] = ({
        unifiedId,
    }) => {
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
    resetHighlightsStyles = () => {
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

    undoAllHighlights = this.resetHighlightsStyles

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

    removeAnnotationHighlights = (unifiedIds: string[]) =>
        unifiedIds.forEach(this.removeAnnotationHighlight)

    /**
     * Removes the highlights of a given annotation.
     */
    removeAnnotationHighlight = (unifiedId: string) => {
        const baseClass = styles['memex-highlight']
        const highlights = document.querySelectorAll(
            `.${baseClass}[data-annotation="${unifiedId}"]`,
        )
        highlights.forEach((highlight) => this._removeHighlight(highlight))
    }

    undoHighlight = this.removeAnnotationHighlight
}
