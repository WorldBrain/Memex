// @ts-nocheck
/* eslint-disable */

/* global PDFViewerApplication */

// import RenderingStates from '../pdfjs-rendering-states'

import { TextPosition, TextRange } from './text-range'
import { TextQuoteAnchor } from './types'

/**
 * @typedef {import('../../types/api').TextPositionSelector} TextPositionSelector
 * @typedef {import('../../types/api').TextQuoteSelector} TextQuoteSelector
 * @typedef {import('../../types/api').Selector} Selector
 *
 * @typedef {import('../../types/pdfjs').PDFPageView} PDFPageView
 * @typedef {import('../../types/pdfjs').PDFViewer} PDFViewer
 */

/**
 * @typedef PdfTextRange
 * @prop {number} pageIndex
 * @prop {Object} anchor
 * @prop {number} anchor.start - Start character offset within the page's text
 * @prop {number} anchor.end - End character offset within the page's text
 */

// Caches for performance.

/**
 * Map of page index to page text content.
 *
 * @type {Object<number,Promise<string>>}
 */
let pageTextCache = {}

/**
 * A cache that maps a `(quote, text offset in document)` key to a specific
 * location in the document.
 *
 * The components of the key come from an annotation's selectors. This is used
 * to speed up re-anchoring an annotation that was previously anchored in the
 * current session.
 *
 * @type {Object<string, Object<number, PdfTextRange>>}
 */
let quotePositionCache = {}

/**
 * Return offset of `node` among its siblings
 *
 * @param {Node} node
 */
function getSiblingIndex(node) {
    let index = 0
    while (node.previousSibling) {
        ++index
        node = node.previousSibling
    }
    return index
}

/**
 * Return the text layer element of the PDF page containing `node`.
 *
 * @param {Node|Element} node
 * @return {Element|null}
 */
function getNodeTextLayer(node) {
    const el = 'closest' in node ? node : node.parentElement
    return el?.closest('.textLayer') ?? null
}

/**
 * Get the PDF.js viewer application.
 *
 * @return {PDFViewer}
 */
function getPdfViewer() {
    // @ts-ignore - TS doesn't know about PDFViewerApplication global.
    console.log('PDF Viewer global?', PDFViewerApplication)
    // @ts-ignore - TS doesn't know about PDFViewerApplication global.
    return PDFViewerApplication.pdfViewer
}

/**
 * Returns the view into which a PDF page is drawn.
 *
 * If called while the PDF document is still loading, this will delay until
 * the document loading has progressed far enough for a `PDFPageView` and its
 * associated `PDFPage` to be ready.
 *
 * @param {number} pageIndex
 * @return {Promise<PDFPageView>}
 */
async function getPageView(pageIndex) {
    const pdfViewer = getPdfViewer()
    let pageView = pdfViewer.getPageView(pageIndex)

    if (!pageView || !pageView.pdfPage) {
        // If the document is still loading, wait for the `pagesloaded` event.
        //
        // Note that loading happens in several stages. Initially the page view
        // objects do not exist (`pageView` will be nullish), then after the
        // "pagesinit" event, the page view exists but it does not have a `pdfPage`
        // property set, then finally after the "pagesloaded" event, it will have
        // a "pdfPage" property.
        pageView = await new Promise((resolve) => {
            const onPagesLoaded = () => {
                if (pdfViewer.eventBus) {
                    pdfViewer.eventBus.off('pagesloaded', onPagesLoaded)
                } else {
                    document.removeEventListener('pagesloaded', onPagesLoaded)
                }

                resolve(pdfViewer.getPageView(pageIndex))
            }

            if (pdfViewer.eventBus) {
                pdfViewer.eventBus.on('pagesloaded', onPagesLoaded)
            } else {
                // Old PDF.js versions (< 1.6.210) use DOM events.
                document.addEventListener('pagesloaded', onPagesLoaded)
            }
        })
    }

    return /** @type {PDFPageView} */ (pageView)
}

/**
 * Return true if the document has selectable text.
 */
export async function documentHasText() {
    const viewer = getPdfViewer()
    let hasText = false
    for (let i = 0; i < viewer.pagesCount; i++) {
        const pageText = await getPageTextContent(i)
        if (pageText.trim().length > 0) {
            hasText = true
            break
        }
    }
    return hasText
}

/**
 * Return the text of a given PDF page.
 *
 * @param {number} pageIndex
 * @return {Promise<string>}
 */
async function getPageTextContent(pageIndex) {
    if (pageTextCache[pageIndex]) {
        return pageTextCache[pageIndex]
    }

    // Join together PDF.js `TextItem`s representing pieces of text in a PDF page.
    const joinItems = (items) => {
        // Skip empty items since PDF.js leaves their text layer divs blank.
        // Excluding them makes our measurements match the rendered text layer.
        // Otherwise, the selectors we generate would not match this stored text.
        // See the `appendText` method of `TextLayerBuilder` in PDF.js.
        const nonEmpty = items
            .filter((item) => /\S/.test(item.str))
            .map((item) => item.str)
        const textContent = nonEmpty.join('')
        return textContent
    }

    // Fetch the text content for a given page as a string.
    const getTextContent = async (pageIndex) => {
        const pageView = await getPageView(pageIndex)
        const textContent = await pageView.pdfPage.getTextContent({
            normalizeWhitespace: true,
        })
        return joinItems(textContent.items)
    }

    pageTextCache[pageIndex] = getTextContent(pageIndex)

    return pageTextCache[pageIndex]
}

/**
 * Return the offset in the text for the whole document at which the text for
 * `pageIndex` begins.
 *
 * @param {number} pageIndex
 * @return {Promise<number>} - Character position at which page text starts
 */
function getPageOffset(pageIndex) {
    let index = -1

    const next = (offset) => {
        ++index
        if (index === pageIndex) {
            return Promise.resolve(offset)
        }

        return getPageTextContent(index).then((textContent) =>
            next(offset + textContent.length),
        )
    }

    return next(0)
}

/**
 * Information about the page where a particular character position in the
 * text of the document occurs.
 *
 * @typedef PageOffset
 * @prop {number} index - Index of page containing offset
 * @prop {number} offset -
 *  Character position of the start of `textContent`
 *  within the full text of the document
 * @prop {string} textContent - Full text of page containing offset
 */

/**
 * Find the index and text content of a page containing the character position
 * `offset` within the complete text of the document.
 *
 * @param {number} offset
 * @return {Promise<PageOffset>}
 */
function findPage(offset) {
    let index = 0
    let total = 0

    // We call `count` once for each page, in order. The passed offset is found on
    // the first page where the cumulative length of the text content exceeds the
    // offset value.
    //
    // When we find the page the offset is on, we return an object containing the
    // page index, the offset at the start of that page, and the textContent of
    // that page.
    //
    // To understand this a little better, here's a worked example. Imagine a
    // document with the following page lengths:
    //
    //    Page 0 has length 100
    //    Page 1 has length 50
    //    Page 2 has length 50
    //
    // Then here are the pages that various offsets are found on:
    //
    //    offset | index
    //    --------------
    //    0      | 0
    //    99     | 0
    //    100    | 1
    //    101    | 1
    //    149    | 1
    //    150    | 2
    const count = (textContent) => {
        const lastPageIndex = getPdfViewer().pagesCount - 1
        if (total + textContent.length > offset || index === lastPageIndex) {
            // Offset is in current page.
            offset = total
            return Promise.resolve({ index, offset, textContent })
        } else {
            // Offset is within a subsequent page.
            ++index
            total += textContent.length
            return getPageTextContent(index).then(count)
        }
    }

    return getPageTextContent(0).then(count)
}

/**
 * Locate the DOM Range which a position selector refers to.
 *
 * If the page is off-screen it may be in an unrendered state, in which case
 * the text layer will not have been created. In that case a placeholder
 * DOM element is created and the returned range refers to that placeholder.
 * In that case, the selector will need to be re-anchored when the page is
 * scrolled into view.
 *
 * @param {number} pageIndex - The PDF page index
 * @param {number} start - Character offset within the page's text
 * @param {number} end - Character offset within the page's text
 * @return {Promise<Range>}
 */
async function anchorByPosition(pageIndex, start, end) {
    const page = await getPageView(pageIndex)

    if (
        page.renderingState === RenderingStates.FINISHED &&
        page.textLayer &&
        page.textLayer.renderingDone
    ) {
        // The page has been rendered. Locate the position in the text layer.
        const root = page.textLayer.textLayerDiv
        const startPos = new TextPosition(root, start)
        const endPos = new TextPosition(root, end)
        return new TextRange(startPos, endPos).toRange()
    }

    // The page has not been rendered yet. Create a placeholder element and
    // anchor to that instead.
    let placeholder = page.div.querySelector('.annotator-placeholder')
    if (!placeholder) {
        placeholder = document.createElement('span')
        placeholder.classList.add('annotator-placeholder')
        placeholder.textContent = 'Loading annotations…'
        page.div.appendChild(placeholder)
    }
    const range = document.createRange()
    range.setStartBefore(placeholder)
    range.setEndAfter(placeholder)
    return range
}

/**
 * Search for a quote in the given pages.
 *
 * @param {number[]} pageIndexes - Pages to search in priority order
 * @param {TextQuoteSelector} quoteSelector
 * @param {Object} positionHint - Options to pass to `TextQuoteAnchor#toPositionAnchor`
 * @return {Promise<Range>} Location of quote
 */
function findInPages(pageIndexes, quoteSelector, positionHint) {
    if (pageIndexes.length === 0) {
        // We reached the end of the document without finding a match for the quote.
        return Promise.reject(new Error('Quote not found'))
    }

    const [pageIndex, ...rest] = pageIndexes

    const content = getPageTextContent(pageIndex)
    const offset = getPageOffset(pageIndex)

    const attempt = ([content, offset]) => {
        const root = document.createElement('div')
        root.textContent = content
        const anchor = TextQuoteAnchor.fromSelector(root, quoteSelector)
        if (positionHint) {
            let hint = positionHint.start - offset
            hint = Math.max(0, hint)
            hint = Math.min(hint, content.length)
            return anchor.toPositionAnchor({ hint })
        }
        return anchor.toPositionAnchor()
    }

    const next = () => findInPages(rest, quoteSelector, positionHint)

    const cacheAndFinish = (anchor) => {
        if (positionHint) {
            if (!quotePositionCache[quoteSelector.exact]) {
                quotePositionCache[quoteSelector.exact] = {}
            }
            quotePositionCache[quoteSelector.exact][positionHint.start] = {
                pageIndex,
                anchor,
            }
        }
        return anchorByPosition(pageIndex, anchor.start, anchor.end)
    }

    // First, get the text offset and other details of the current page.
    return (
        Promise.all([content, offset])
            // Attempt to locate the quote in the current page.
            .then(attempt)
            // If the quote is located, find the DOM range and return it.
            .then(cacheAndFinish)
            // If the quote was not found, try the next page.
            .catch(next)
    )
}

/**
 * Return a list of page indexes to search for a quote in priority order.
 *
 * When a position anchor is available, quote search can be optimized by
 * searching pages nearest the expected position first.
 *
 * @param {number} position - Text offset from start of document
 * @return {Promise<number[]>}
 */
function prioritizePages(position) {
    const pageCount = getPdfViewer().pagesCount
    const pageIndices = Array(pageCount)
        .fill(0)
        .map((_, i) => i)

    if (!position) {
        return Promise.resolve(pageIndices)
    }

    /**
     * Sort page indexes by offset from `pageIndex`.
     *
     * @param {number} pageIndex
     */
    function sortPages(pageIndex) {
        const left = pageIndices.slice(0, pageIndex)
        const right = pageIndices.slice(pageIndex)
        const result = []
        while (left.length > 0 || right.length > 0) {
            if (right.length) {
                result.push(/** @type {number} */ (right.shift()))
            }
            if (left.length) {
                result.push(/** @type {number} */ (left.pop()))
            }
        }
        return result
    }

    return findPage(position).then(({ index }) => sortPages(index))
}

/**
 * Anchor a set of selectors to a DOM Range.
 *
 * @param {HTMLElement} root
 * @param {Selector[]} selectors - Selector objects to anchor
 * @return {Promise<Range>}
 */
export function anchor(root, selectors) {
    const position = /** @type {TextPositionSelector|undefined} */ (selectors.find(
        (s) => s.type === 'TextPositionSelector',
    ))
    const quote = /** @type {TextQuoteSelector|undefined} */ (selectors.find(
        (s) => s.type === 'TextQuoteSelector',
    ))

    /** @type {Promise<Range>} */
    let result = Promise.reject('unable to anchor')

    const checkQuote = (range) => {
        if (quote && quote.exact !== range.toString()) {
            throw new Error('quote mismatch')
        }
        return range
    }

    if (position) {
        result = result.catch(() => {
            return findPage(position.start).then(
                ({ index, offset, textContent }) => {
                    const start = position.start - offset
                    const end = position.end - offset
                    const length = end - start

                    checkQuote(textContent.substr(start, length))

                    return anchorByPosition(index, start, end)
                },
            )
        })
    }

    if (quote) {
        result = result.catch(() => {
            if (
                position &&
                quotePositionCache[quote.exact] &&
                quotePositionCache[quote.exact][position.start]
            ) {
                const { pageIndex, anchor } = quotePositionCache[quote.exact][
                    position.start
                ]
                return anchorByPosition(pageIndex, anchor.start, anchor.end)
            }

            return prioritizePages(position?.start ?? 0).then((pageIndices) => {
                return findInPages(pageIndices, quote, position)
            })
        })
    }

    return result
}

/**
 * Convert a DOM Range object into a set of selectors.
 *
 * Converts a DOM `Range` object into a `[position, quote]` tuple of selectors
 * which can be saved with an annotation and later passed to `anchor` to
 * convert the selectors back to a `Range`.
 *
 * @param {HTMLElement} root - The root element
 * @param {Range} range
 * @return {Promise<Selector[]>}
 */
export async function describe(root, range) {
    // "Shrink" the range so that the start and endpoints are at offsets within
    // text nodes rather than any containing nodes.
    try {
        range = TextRange.fromRange(range).toRange()
    } catch {
        throw new Error('Selection does not contain text')
    }

    const startTextLayer = getNodeTextLayer(range.startContainer)
    const endTextLayer = getNodeTextLayer(range.endContainer)

    if (!startTextLayer || !endTextLayer) {
        throw new Error('Selection is outside page text')
    }

    if (startTextLayer !== endTextLayer) {
        throw new Error('Selecting across page breaks is not supported')
    }

    const startPos = TextPosition.fromPoint(
        range.startContainer,
        range.startOffset,
    ).relativeTo(startTextLayer)

    const endPos = TextPosition.fromPoint(
        range.endContainer,
        range.endOffset,
    ).relativeTo(endTextLayer)

    const startPageIndex = getSiblingIndex(
        /** @type {Node} */ (startTextLayer.parentNode),
    )
    const pageOffset = await getPageOffset(startPageIndex)

    /** @type {TextPositionSelector} */
    const position = {
        type: 'TextPositionSelector',
        start: pageOffset + startPos.offset,
        end: pageOffset + endPos.offset,
    }

    const quote = TextQuoteAnchor.fromRange(root, range).toSelector()

    return [position, quote]
}

/**
 * Clear this module's internal caches.
 *
 * This exists mainly as a helper for use in tests.
 */
export function purgeCache() {
    pageTextCache = {}
    quotePositionCache = {}
}
