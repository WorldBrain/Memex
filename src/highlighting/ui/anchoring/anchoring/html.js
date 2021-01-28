// @ts-nocheck
/* eslint-disable */

import { RangeAnchor, TextPositionAnchor, TextQuoteAnchor } from './types'

/**
 * @typedef {import('../../types/api').Selector} Selector
 */

/**
 * @param {RangeAnchor|TextPositionAnchor|TextQuoteAnchor} anchor
 * @param {Object} [options]
 *  @param {number} [options.hint]
 */
async function querySelector(anchor, options = {}) {
    return anchor.toRange(options)
}

/**
 * Anchor a set of selectors.
 *
 * This function converts a set of selectors into a document range.
 * It encapsulates the core anchoring algorithm, using the selectors alone or
 * in combination to establish the best anchor within the document.
 *
 * @param {Element} root - The root element of the anchoring context.
 * @param {Selector[]} selectors - The selectors to try.
 * @param {Object} [options]
 *   @param {number} [options.hint]
 */
export function anchor(root, selectors, options = {}) {
    let position = null
    let quote = null
    let range = null

    // Collect all the selectors
    for (let selector of selectors) {
        switch (selector.type) {
            case 'TextPositionSelector':
                position = selector
                options.hint = position.start // TextQuoteAnchor hint
                break
            case 'TextQuoteSelector':
                quote = selector
                break
            case 'RangeSelector':
                range = selector
                break
        }
    }

    /**
     * Assert the quote matches the stored quote, if applicable
     * @param {Range} range
     */
    const maybeAssertQuote = (range) => {
        if (quote?.exact && range.toString() !== quote.exact) {
            throw new Error('quote mismatch')
        } else {
            return range
        }
    }

    // From a default of failure, we build up catch clauses to try selectors in
    // order, from simple to complex.
    /** @type {Promise<Range>} */
    let promise = Promise.reject('unable to anchor')

    if (range) {
        promise = promise.catch(() => {
            const anchor = RangeAnchor.fromSelector(root, range)
            return querySelector(anchor, options).then(maybeAssertQuote)
        })
    }

    if (position) {
        promise = promise.catch(() => {
            const anchor = TextPositionAnchor.fromSelector(root, position)
            return querySelector(anchor, options).then(maybeAssertQuote)
        })
    }

    if (quote) {
        promise = promise.catch(() => {
            const anchor = TextQuoteAnchor.fromSelector(root, quote)
            return querySelector(anchor, options)
        })
    }

    return promise
}

/**
 * @param {Element} root
 * @param {Range} range
 */
export function describe(root, range) {
    const types = [RangeAnchor, TextPositionAnchor, TextQuoteAnchor]
    const result = []
    for (const type of types) {
        try {
            const anchor = type.fromRange(root, range)
            result.push(anchor.toSelector())
        } catch (error) {
            continue
        }
    }
    return result
}
