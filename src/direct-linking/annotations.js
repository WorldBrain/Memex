import * as textQuote from 'dom-anchor-text-quote'
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
    return {
        strategy: 'dom-anchor-text-quote',
        content: textQuote.fromRange(root, range),
    }
}

export async function descriptorToRange({ descriptor }) {
    const root = document.body
    return textQuote.toRange(root, descriptor.content)
}

export default function markRange({ range, cssClass }) {
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
