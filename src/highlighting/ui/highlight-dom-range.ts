/**
 * Custom implementation of `dom-highlight-range`.
 * The original implementation is available here: https://github.com/Treora/dom-highlight-range
 *
 * This implementation does not make use of `span` tag for highlighting the text
 * in a range. Instead, it uses a custom `memex-highlight` tag. This ensures
 * that the CSS for highlighting does not bleed too much into the host site.
 * Also, unlike the original implementation, tables are handled properly.
 */

// Wrap each text node in a given DOM Range with a <memex-highlight class=[highLightClass]>.
// Breaks start and/or end node if needed.
// Returns a function that cleans up the created highlight (not a perfect undo: split text nodes are not merged again).
//
// Parameters:
// - rangeObject: a Range whose start and end containers are text nodes.
// - highlightClass: the CSS class the text pieces in the range should get, defaults to 'highlighted-range'.
export const highlightDOMRange = (
    rangeObject: Range,
    highlightClass: string,
) => {
    // Ignore range if empty.
    if (rangeObject.collapsed) {
        return
    }

    if (typeof highlightClass === 'undefined') {
        highlightClass = 'highlighted-range'
    }

    // First put all nodes in an array (splits start and end nodes)
    const nodes: Node[] = textNodesInRange(rangeObject)

    // Remember range details to restore it later.
    const { startContainer, startOffset, endContainer, endOffset } = rangeObject

    // Highlight each node
    // const highlights: HTMLElement[] =
    nodes.forEach(node => highlightNode(node, highlightClass))

    // Reset selection
    clearBrowserSelection()

    // The rangeObject gets messed up by our DOM changes. Be kind and restore.
    rangeObject.setStart(startContainer, startOffset)
    rangeObject.setEnd(endContainer, endOffset)
}

// Resets any selected content in the window, useful to stop content script popping up again inconsistently.
const clearBrowserSelection = () => {
    if (window.getSelection) {
        if (window.getSelection().empty) {
            // Chrome
            window.getSelection().empty()
        } else if (window.getSelection().removeAllRanges) {
            // Firefox
            window.getSelection().removeAllRanges()
        }
    } else if (document['selection']) {
        // IE
        document['selection'].empty()
    }
}

// Return an array of the text nodes in the range. Split the start and end nodes if required.
// Maybe change the type of rangeObject to `Range` in the future. Currently,
// doing so breaks the usage of some properties/methods like `length` and
// `splitText()` on `startContainer`.
const textNodesInRange = (rangeObject: any) => {
    // Modify Range to make sure that the start and end nodes are text nodes.
    setRangeToTextNodes(rangeObject)

    // Ignore range if empty.
    if (rangeObject.collapsed) {
        return []
    }

    // Include (part of) the start node if needed.
    if (rangeObject.startOffset !== rangeObject.startContainer.length) {
        // If only part of the start node is in the range, split it.
        if (rangeObject.startOffset !== 0) {
            // Split startContainer to turn the part after the startOffset into a new node.
            const createdNode: Text = rangeObject.startContainer.splitText(
                rangeObject.startOffset,
            )

            // If the end was in the same container, it will now be in the newly created node.
            if (rangeObject.endContainer === rangeObject.startContainer) {
                rangeObject.setEnd(
                    createdNode,
                    rangeObject.endOffset - rangeObject.startOffset,
                )
            }

            // Update the start node, which no longer has an offset.
            rangeObject.setStart(createdNode, 0)
        }
    }

    // Find the root for the range object.
    const root: Node =
        typeof rangeObject.commonAncestorContainer !== 'undefined'
            ? rangeObject.commonAncestorContainer
            : document.body // fall back to whole document for browser compatibility

    // Create an iterator to iterate through the nodes.
    // Type should be `NodeIterator` but doing so breaks the usage of
    // `iter.referenceNode` for some reason.
    const iter: any = document.createNodeIterator(root, NodeFilter.SHOW_TEXT)

    // Find the start node (could we somehow skip this seemingly needless search?)
    while (
        iter.referenceNode !== rangeObject.startContainer &&
        iter.referenceNode !== null
    ) {
        iter.nextNode()
    }

    // Regex for checking against whitespace.
    const whiteSpace: RegExp = /^\s*$/
    const nodes: Node[] = []

    // Add each node up to (but excluding) the end node.
    while (
        iter.referenceNode !== rangeObject.endContainer &&
        iter.referenceNode !== null
    ) {
        // Don't push the nodes that consist entirely of whitespace.
        if (!whiteSpace.test(iter.referenceNode.nodeValue)) {
            nodes.push(iter.referenceNode)
        }
        iter.nextNode()
    }

    // Include (part of) the end node if needed.
    if (rangeObject.endOffset !== 0) {
        // If it is only partly included, we need to split it up.
        if (rangeObject.endOffset !== rangeObject.endContainer.length) {
            // Split the node, breaking off the part outside the range.
            rangeObject.endContainer.splitText(rangeObject.endOffset)
            // Note that the range object need not be updated.

            // assert(rangeObject.endOffset == rangeObject.endContainer.length);
        }

        // Add the end node.
        nodes.push(rangeObject.endContainer)
    }

    return nodes
}

// Normalise the range to start and end in a text node.
// Copyright (c) 2015 Randall Leeds
const setRangeToTextNodes = (rangeObject: Range) => {
    let startNode: Node = rangeObject.startContainer
    let startOffset: number = rangeObject.startOffset

    // Drill down to a text node if the range starts at the container boundary.
    if (startNode.nodeType !== Node.TEXT_NODE) {
        if (startOffset === startNode.childNodes.length) {
            startNode = startNode.childNodes[startOffset - 1]
            startNode = getFirstTextNode(startNode)
            startOffset = startNode.textContent.length
        } else {
            startNode = startNode.childNodes[startOffset]
            startNode = getFirstTextNode(startNode)
            startOffset = 0
        }
        rangeObject.setStart(startNode, startOffset)
    }

    let endNode: Node = rangeObject.endContainer
    let endOffset: number = rangeObject.endOffset

    // Drill down to a text node if the range ends at the container boundary.
    if (endNode.nodeType !== Node.TEXT_NODE) {
        if (endOffset === endNode.childNodes.length) {
            endNode = endNode.childNodes[endOffset - 1]
            endNode = getFirstTextNode(endNode)
            endOffset = endNode.textContent.length
        } else {
            endNode = endNode.childNodes[endOffset]
            endNode = getFirstTextNode(endNode)
            endOffset = 0
        }
        rangeObject.setEnd(endNode, endOffset)
    }
}

// Gets first text node inside a node.
const getFirstTextNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
        return node
    }
    const document: Document = node.ownerDocument
    const walker: TreeWalker = document.createTreeWalker(
        node,
        NodeFilter.SHOW_TEXT,
        null,
        false,
    )
    return walker.firstChild()
}

// Replace [node] with <memex-highlight class=[highlightClass]>[node]</memex-highlight>
const highlightNode = (node: Node, highlightClass: string) => {
    // Create a highlight
    const highlight: HTMLElement = document.createElement('memex-highlight')
    highlight.classList.add(highlightClass)

    // Wrap it around the text node
    node.parentNode.replaceChild(highlight, node)
    highlight.appendChild(node)

    return highlight
}

// Remove a highlight <memex-highlight> created with highlightNode.
const removeHighlight = (highlight: HTMLElement) => {
    // Move its children (normally just one text node) into its parent.
    while (highlight.firstChild) {
        highlight.parentNode.insertBefore(highlight.firstChild, highlight)
    }
    // Remove the now empty node
    highlight.remove()
}
