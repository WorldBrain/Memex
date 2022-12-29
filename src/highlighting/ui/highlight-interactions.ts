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
import { generateAnnotationUrl } from 'src/annotations/utils'
import { highlightRange } from 'src/highlighting/ui/anchoring/highlighter'
import { getHTML5VideoTimestamp } from '@worldbrain/memex-common/lib/editor/utils'
import { reshapeAnnotationForCache } from 'src/annotations/cache/utils'
import type { AnnotationInterface } from 'src/annotations/background/types'
import browser from 'webextension-polyfill'
import * as PDFs from 'src/highlighting/ui/anchoring/anchoring/pdf.js'
import { throttle } from 'lodash'
import hexToRgb from 'hex-to-rgb'

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
    private highlightedElsByUnifiedAnnotId: {
        [unifiedId: string]: HTMLElement[]
    } = {}
    defaultHighlightColor
    currentActiveHighlight

    constructor(
        private deps: {
            annotationsBG: AnnotationInterface<'caller'>
        },
    ) {
        document.addEventListener('click', this.handleOutsideHighlightClick)
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

    saveAndRenderHighlightAndEditInSidebar: HighlightInteractionsInterface['saveAndRenderHighlightAndEditInSidebar'] = async (
        params,
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

        const annotationLists = []
        if (params.inPageUI.selectedList) {
            const selectedList =
                params.annotationsCache.lists.byId[params.inPageUI.selectedList]
            if (selectedList.localId != null) {
                annotationLists.push(selectedList.localId)
            }
        }

        const now = new Date()
        const annotation: Annotation &
            Required<Pick<Annotation, 'createdWhen' | 'lastEdited'>> = {
            url: generateAnnotationUrl({ pageUrl, now: () => Date.now() }),
            body: hasSelectedText
                ? anchor.quote
                : videoTimeStampForComment && undefined,
            pageUrl,
            tags: [],
            lists: annotationLists,
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
                extraData: { creator: params.currentUser },
            })
            const { unifiedId } = params.annotationsCache.addAnnotation(
                cacheAnnotation,
            )

            await Promise.all([
                this.deps.annotationsBG.createAnnotation({
                    ...annotation,
                    title: annotation.pageTitle,
                }),
                this.renderHighlight(
                    { ...cacheAnnotation, unifiedId },
                    ({ openInEdit, unifiedAnnotationId }) => {
                        params.inPageUI.showSidebar({
                            annotationUrl: unifiedAnnotationId,
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

    renderHighlight: HighlightInteractionsInterface['renderHighlight'] = async (
        highlight,
        onClick,
        temporary = false,
    ) => {
        let highlightColor = this.defaultHighlightColor
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

                for (let highlights of highlightedElements) {
                    highlights.style.setProperty(
                        '--defaultHighlightColorCSS',
                        this.defaultHighlightColor,
                    )

                    if (highlights.parentNode.nodeName === 'A') {
                        highlights.style['color'] = '#0b0080'
                    }
                }

                this.attachEventListenersToNewHighlights(highlight, onClick)
                this.highlightedElsByUnifiedAnnotId[
                    highlight.unifiedId
                ] = highlightedElements

                for (let highlights of highlightedElements) {
                    if (highlights.parentNode.nodeName === 'A') {
                        highlights.style['color'] = '#0b0080'
                    }
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
        temp,
    ) => {
        const highlightsColor = await browser.storage.local.get(
            '@highlight-colors',
        )
        this.defaultHighlightColor = hexToRgb(
            highlightsColor['@highlight-colors'],
        ).toString()

        browser.storage.onChanged.addListener((change) => {
            this.defaultHighlightColor = change['@highlight-colors'].newValue
        })

        await Promise.all(
            highlights.map(async (highlight) => {
                await this.renderHighlight(highlight, onClick, temp)
            }),
        )
        this.watchForReanchors(highlights, onClick)
    }

    private watchForReanchors = (
        highlights: UnifiedAnnotation[],
        onClick: AnnotationClickHandler,
    ) => {
        if (!this.observer) {
            // @ts-ignore
            const pdfViewer = globalThis.PDFViewerApplication?.pdfViewer

            if (pdfViewer) {
                this.observer = new MutationObserver(
                    throttle(() => this.reanchorer(highlights, onClick), 1000),
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

    private reanchorer = (
        highlights: UnifiedAnnotation[],
        onClick: AnnotationClickHandler,
    ) => {
        const reanchors = highlights.filter(
            (h) =>
                !document.body.contains(
                    this.highlightedElsByUnifiedAnnotId[h.unifiedId]?.pop() ??
                        null,
                ),
        )

        if (reanchors.length > 0) {
            this.renderHighlights(reanchors, onClick)
        }

        // for (let item of reanchors) {
        //     let currentPageIndex = globalThis.PDFViewerApplication?.page
        //     PDFs.findPage(item.selector.descriptor.content[1].start).then(
        //         ({ index, offset, textContent }) => {
        //             console.log('test',)
        //             if (index !== currentPageIndex) {
        //                 return
        //             } else {
        //                 if (reanchors.length > 0) {
        //                     console.log('attempt at reanchoring')
        //                     this.renderHighlights(reanchors, onClick)
        //                 }
        //             }
        //         },
        //     )
        // }
    }

    /**
     * Scrolls to the highlight of the given annotation on the current page.
     */
    scrollToHighlight: HighlightInteractionsInterface['scrollToHighlight'] = ({
        unifiedId,
    }) => {
        const baseClass = styles['memex-highlight']
        const $highlight = document.querySelector(
            `.${baseClass}[data-annotation="${unifiedId}"]`,
        ) as HTMLElement

        if ($highlight) {
            console.log('scrollto')
            $highlight.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else {
            console.error('MEMEX: Oops, no highlight found to scroll to')
        }
    }
    /**
     * Scrolls the annotation card into ivew of the given annotation on the current page.
     */
    private scrollCardIntoView = ({ unifiedId }: UnifiedAnnotation) => {
        console.log('exec')
        const baseClass = 'AnnotationBox'
        const highlights = document.getElementById('memex-sidebar-container')

        console.log(highlights)

        const highlight = highlights.shadowRoot.getElementById(unifiedId)

        highlight.scrollIntoView({ behavior: 'smooth', block: 'center' })
        console.log(highlight)

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
    highlightAndScroll: HighlightInteractionsInterface['highlightAndScroll'] = (
        annotation,
    ) => {
        this.removeSelectedHighlights(annotation)
        this.resetHighlightsStyles()
        this.removeSelectedHighlights(this.currentActiveHighlight)
        this.selectHighlight(annotation)
        this.scrollToHighlight(annotation)
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
            highlightEl.dataset.annotation = highlight.unifiedId

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
                    unifiedAnnotationId: highlight.unifiedId,
                    openInEdit: e.getModifierState('Shift'),
                })
                // make sure to remove all other selections before selecting the new one
                this.resetHighlightsStyles()
                this.selectHighlight(highlight)
                this.scrollCardIntoView(highlight)
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
                    this.defaultHighlightColor,
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
                    this.defaultHighlightColor,
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
        this.currentActiveHighlight = annotation.unifiedId
        const highlights = document.querySelectorAll(
            `[data-annotation="${annotation.unifiedId}"]`,
        )
        const pdfViewer = globalThis.PDFViewerApplication?.pdfViewer

        if (pdfViewer) {
            PDFs.anchor(
                document.body,
                annotation?.selector.descriptor.content,
                true,
            )
        }

        highlights.forEach((highlight: HTMLElement) => {
            highlight.classList.add(styles['selectedHighlight'])
            highlight.classList.remove(styles['hoveredHighlight'])
            highlight.style.setProperty(
                '--defaultHighlightColorCSS',
                this.defaultHighlightColor,
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
                    this.defaultHighlightColor,
                )
                // highlight.style['background-color'] = this.defaultHighlightColor
                // highlight.style['border-bottom'] = 'unset'
            }
        })
        this.currentActiveHighlight = ''
    }
    /**
     * Return highlights to normal state
     */
    resetHighlightsStyles = () => {
        const highlights = document.querySelectorAll(`[data-annotation]`)
        highlights.forEach((highlight: HTMLElement) => {
            if (
                highlight.getAttribute('data-annotation') ===
                this.currentActiveHighlight
            ) {
                highlight.classList.remove(styles['selectedHighlight'])
                highlight.style.setProperty(
                    '--defaultHighlightColorCSS',
                    this.defaultHighlightColor,
                )
            } else {
                highlight.classList.remove(styles['selectedHighlight'])
                highlight.style.setProperty(
                    '--defaultHighlightColorCSS',
                    this.defaultHighlightColor,
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
