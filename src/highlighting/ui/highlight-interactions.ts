import analytics from 'src/analytics'
import debounce from 'lodash/debounce'

import type {
    Anchor,
    HighlightElement,
    SaveAndRenderHighlightDeps,
    HighlightInteractionsInterface,
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
import type { UnifiedAnnotation } from 'src/annotations/cache/types'
import type { AnnotationInterface } from 'src/annotations/background/types'

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

export class HighlightRenderer implements HighlightRendererInterface {
    private observer: MutationObserver
    private highlightedElsByUnifiedAnnotId: {
        [unifiedId: string]: HTMLElement[]
    } = {}

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

        this.removeHighlights({ onlyRemoveDarkHighlights: true })
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
        if (params.inPageUI.selectedSpace) {
            annotationLists.push(params.inPageUI.selectedSpace.localId)
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
                creator: { type: 'user-reference', id: 123 },
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
        if (!highlight?.selector?.descriptor?.content) {
            return
        }

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

                highlightedElements = highlightRange(range, baseClass)
                // markRange({ range, cssClass: baseClass })

                this.attachEventListenersToNewHighlights(highlight, onClick)
                this.highlightedElsByUnifiedAnnotId[
                    highlight.unifiedId
                ] = highlightedElements
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
        await Promise.all(
            highlights.map(async (highlight) => {
                await this.renderHighlight(highlight, onClick, temp)
            }),
        )
        this.watchForReanchors(highlights, onClick)
        // return highlights
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
            $highlight.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else {
            console.error('MEMEX: Oops, no highlight found to scroll to')
        }
    }
    /**
     * Given an annotation object, highlights that text and removes other highlights
     * from the page.
     */
    highlightAndScroll: HighlightInteractionsInterface['highlightAndScroll'] = (
        annotation,
    ) => {
        this.removeHighlights({ onlyRemoveDarkHighlights: true })
        this.makeHighlightDark(annotation)
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
                this.removeHighlights({ onlyRemoveDarkHighlights: true })
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
     */
    makeHighlightMedium: HighlightInteractionsInterface['makeHighlightMedium'] = ({
        unifiedId,
    }) => {
        // Make the current annotation as a "medium" highlight.
        const baseClass = styles['memex-highlight']
        const mediumClass = styles['medium']
        const highlights = document.querySelectorAll(
            `.${baseClass}[data-annotation="${unifiedId}"]`,
        )
        highlights.forEach((highlight) => highlight.classList.add(mediumClass))
    }
    /**
     * Makes the highlight a dark highlight.
     */
    makeHighlightDark: HighlightInteractionsInterface['makeHighlightDark'] = ({
        unifiedId,
    }) => {
        const baseClass = styles['memex-highlight']
        const highlights = document.querySelectorAll(
            `.${baseClass}[data-annotation="${unifiedId}"]`,
        )

        highlights.forEach((highlight) => {
            highlight.classList.add(styles['dark'])
        })
    }

    /**
     * Removes all highlight elements in the current page.
     * If `onlyRemoveDarkHighlights` is true, only dark highlights will be removed.
     */
    removeHighlights = (args?: { onlyRemoveDarkHighlights?: boolean }) => {
        this.removeTempHighlights()

        const baseClass = '.' + styles['memex-highlight']
        const darkClass = args?.onlyRemoveDarkHighlights
            ? '.' + styles['dark']
            : ''
        const highlightClass = `${baseClass}${darkClass}`
        const highlights = document.querySelectorAll(highlightClass)

        if (args?.onlyRemoveDarkHighlights) {
            highlights.forEach((highlight) =>
                highlight.classList.remove(styles['dark']),
            )
        } else {
            highlights.forEach((highlight) => this._removeHighlight(highlight))
        }
    }
    undoAllHighlights = this.removeHighlights

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
