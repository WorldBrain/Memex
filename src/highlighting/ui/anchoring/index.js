import * as domTextQuote from 'dom-anchor-text-quote'
import * as domTextPosition from 'dom-anchor-text-position'
import * as hypAnchoring from './anchoring/html'
import { highlightDOMRange } from '../highlight-dom-range'

export async function selectionToDescriptor({ selection }) {
    if (selection === null || selection.isCollapsed) {
        return null
    }

    const range = selection.getRangeAt(0)
    const root = document.body
    return {
        strategy: 'hyp-anchoring',
        content: hypAnchoring.describe(root, range),
    }
}

export async function descriptorToRange({ descriptor }) {
    const root = document.body
    if (descriptor.strategy === 'dom-anchor-text-quote') {
        return domTextQuote.toRange(root, descriptor.content)
    }
    if (descriptor.strategy === 'hyp-anchoring') {
        return hypAnchoring.anchor(root, descriptor.content)
    }

    const rangeFromQuote = domTextQuote.toRange(
        root,
        descriptor.content.textQuote,
    )
    if (!rangeFromQuote) {
        return null
    }
    if (
        !hasAncestor(
            rangeFromQuote.commonAncestorContainer,
            node => node.tagName && node.tagName.toLowerCase() === 'script',
        )
    ) {
        return rangeFromQuote
    }

    const rangeFromPosition = domTextPosition.toRange(root, descriptor.content)
    if (!rangeFromPosition) {
        return null
    }
    if (rangeFromPosition.toString() === descriptor.content.string) {
        return rangeFromPosition
    }

    return null
}

export function markRange({ range, cssClass }) {
    return highlightDOMRange(range, cssClass)
}

function hasAncestor(node, test) {
    while (node !== document.body) {
        if (test(node)) {
            return true
        }
        node = node.parentNode
    }

    return false
}
