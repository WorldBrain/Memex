import * as domTextQuote from 'dom-anchor-text-quote'
import * as domTextPosition from 'dom-anchor-text-position'
import highlightRange from 'dom-highlight-range'

export function isSelectionWithinCorpus({ selection, corpus }) {
    if (selection === null || selection.isCollapsed) {
        return false
    }

    const range = selection.getRangeAt(0)
    return isWithinNode(range, corpus)
}

export async function selectionToDescriptor({ selection }) {
    if (selection === null || selection.isCollapsed) {
        return null
    }

    const range = selection.getRangeAt(0)
    const root = document.body
    const textQuote = domTextQuote.fromRange(root, range)
    const textPosition = domTextPosition.fromRange(root, range)
    return {
        strategy: 'dom-anchor-text-position-or-quote',
        content: {
            textQuote,
            textPosition,
            string: range.toString(),
        },
    }
}

export async function descriptorToRange({ descriptor }) {
    const root = document.body
    if (descriptor.strategy === 'dom-anchor-text-quote') {
        return domTextQuote.toRange(root, descriptor.content)
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
    highlightRange(range, cssClass)
}

function isWithinNode(range, node) {
    const nodeRange = document.createRange()
    nodeRange.selectNode(node)

    return (
        range.compareBoundaryPoints(Range.START_TO_START, nodeRange) >= 0 &&
        range.compareBoundaryPoints(Range.END_TO_END, nodeRange) <= 0
    )
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
