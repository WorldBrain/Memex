// @ts-nocheck
/* eslint-disable */

/**
 * This module exports a set of classes for converting between DOM `Range`
 * objects and different types of selectors. It is mostly a thin wrapper around a
 * set of anchoring libraries. It serves two main purposes:
 *
 *  1. Providing a consistent interface across different types of anchors.
 *  2. Insulating the rest of the code from API changes in the underlying anchoring
 *     libraries.
 */

import { matchQuote } from './match-quote'
import { TextRange, TextPosition } from './text-range'
import { nodeFromXPath, xpathFromNode } from './xpath'

/**
 * @typedef {import('../../types/api').RangeSelector} RangeSelector
 * @typedef {import('../../types/api').TextPositionSelector} TextPositionSelector
 * @typedef {import('../../types/api').TextQuoteSelector} TextQuoteSelector
 */

/**
 * Converts between `RangeSelector` selectors and `Range` objects.
 */
export class RangeAnchor {
    /**
     * @param {Node} root - A root element from which to anchor.
     * @param {Range} range -  A range describing the anchor.
     */
    constructor(root, range) {
        this.root = root
        this.range = range
    }

    /**
     * @param {Node} root -  A root element from which to anchor.
     * @param {Range} range -  A range describing the anchor.
     */
    static fromRange(root, range) {
        return new RangeAnchor(root, range)
    }

    /**
     * Create an anchor from a serialized `RangeSelector` selector.
     *
     * @param {Element} root -  A root element from which to anchor.
     * @param {RangeSelector} selector
     */
    static fromSelector(root, selector) {
        const startContainer = nodeFromXPath(selector.startContainer, root)
        if (!startContainer) {
            throw new Error('Failed to resolve startContainer XPath')
        }

        const endContainer = nodeFromXPath(selector.endContainer, root)
        if (!endContainer) {
            throw new Error('Failed to resolve endContainer XPath')
        }

        const startPos = TextPosition.fromCharOffset(
            startContainer,
            selector.startOffset,
        )
        const endPos = TextPosition.fromCharOffset(
            endContainer,
            selector.endOffset,
        )

        const range = new TextRange(startPos, endPos).toRange()
        return new RangeAnchor(root, range)
    }

    toRange() {
        return this.range
    }

    /**
     * @return {RangeSelector}
     */
    toSelector() {
        // "Shrink" the range so that it tightly wraps its text. This ensures more
        // predictable output for a given text selection.
        const normalizedRange = TextRange.fromRange(this.range).toRange()

        const textRange = TextRange.fromRange(normalizedRange)
        const startContainer = xpathFromNode(textRange.start.element, this.root)
        const endContainer = xpathFromNode(textRange.end.element, this.root)

        return {
            type: 'RangeSelector',
            startContainer,
            startOffset: textRange.start.offset,
            endContainer,
            endOffset: textRange.end.offset,
        }
    }
}

/**
 * Converts between `TextPositionSelector` selectors and `Range` objects.
 */
export class TextPositionAnchor {
    /**
     * @param {Element} root
     * @param {number} start
     * @param {number} end
     */
    constructor(root, start, end) {
        this.root = root
        this.start = start
        this.end = end
    }

    /**
     * @param {Element} root
     * @param {Range} range
     */
    static fromRange(root, range) {
        const textRange = TextRange.fromRange(range).relativeTo(root)
        return new TextPositionAnchor(
            root,
            textRange.start.offset,
            textRange.end.offset,
        )
    }
    /**
     * @param {Element} root
     * @param {TextPositionSelector} selector
     */
    static fromSelector(root, selector) {
        return new TextPositionAnchor(root, selector.start, selector.end)
    }

    /**
     * @return {TextPositionSelector}
     */
    toSelector() {
        return {
            type: 'TextPositionSelector',
            start: this.start,
            end: this.end,
        }
    }

    toRange() {
        return TextRange.fromOffsets(this.root, this.start, this.end).toRange()
    }
}

/**
 * @typedef QuoteMatchOptions
 * @prop {number} [hint] - Expected position of match in text. See `matchQuote`.
 */

/**
 * Converts between `TextQuoteSelector` selectors and `Range` objects.
 */
export class TextQuoteAnchor {
    /**
     * @param {Element} root - A root element from which to anchor.
     * @param {string} exact
     * @param {Object} context
     *   @param {string} [context.prefix]
     *   @param {string} [context.suffix]
     */
    constructor(root, exact, context = {}) {
        this.root = root
        this.exact = exact
        this.context = context
    }

    /**
     * Create a `TextQuoteAnchor` from a range.
     *
     * Will throw if `range` does not contain any text nodes.
     *
     * @param {Element} root
     * @param {Range} range
     */
    static fromRange(root, range) {
        const text = /** @type {string} */ (root.textContent)
        const textRange = TextRange.fromRange(range).relativeTo(root)

        const start = textRange.start.offset
        const end = textRange.end.offset

        // Number of characters around the quote to capture as context. We currently
        // always use a fixed amount, but it would be better if this code was aware
        // of logical boundaries in the document (paragraph, article etc.) to avoid
        // capturing text unrelated to the quote.
        //
        // In regular prose the ideal content would often be the surrounding sentence.
        // This is a natural unit of meaning which enables displaying quotes in
        // context even when the document is not available. We could use `Intl.Segmenter`
        // for this when available.
        const contextLen = 32

        return new TextQuoteAnchor(root, text.slice(start, end), {
            prefix: text.slice(Math.max(0, start - contextLen), start),
            suffix: text.slice(end, Math.min(text.length, end + contextLen)),
        })
    }

    /**
     * @param {Element} root
     * @param {TextQuoteSelector} selector
     */
    static fromSelector(root, selector) {
        const { prefix, suffix } = selector
        return new TextQuoteAnchor(root, selector.exact, { prefix, suffix })
    }

    /**
     * @return {TextQuoteSelector}
     */
    toSelector() {
        return {
            type: 'TextQuoteSelector',
            exact: this.exact,
            prefix: this.context.prefix,
            suffix: this.context.suffix,
        }
    }

    /**
     * @param {QuoteMatchOptions} [options]
     */
    toRange(options = {}) {
        return this.toPositionAnchor(options).toRange()
    }

    /**
     * @param {QuoteMatchOptions} [options]
     */
    toPositionAnchor(options = {}) {
        const text = /** @type {string} */ (this.root.textContent)
        const match = matchQuote(text, this.exact, {
            ...this.context,
            hint: options.hint,
        })
        console.log(`toPositionAnchor`, { options, text, match })

        if (!match) {
            throw new Error('Quote not found')
        }
        return new TextPositionAnchor(this.root, match.start, match.end)
    }
}
