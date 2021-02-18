/**
 * Copyright (c) 2013-2019 Hypothes.is Project and contributors

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 2. Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


 Subcomponents

 The project includes a number of subcomponents with separate
 copyright notices and license terms. Your use of the code for the these
 subcomponents is subject to the terms and conditions of the following licenses.

 For the annotator subcomponent:

 Copyright 2012 Aron Carroll, Rufus Pollock, and Nick Stenning.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */
// @ts-nocheck
/* eslint-disable */
/**
 * Returns true if the start point of a selection occurs after the end point,
 * in document order.
 *
 * @param {Selection} selection
 */
export function isSelectionBackwards(selection) {
    if (selection.focusNode === selection.anchorNode) {
        return selection.focusOffset < selection.anchorOffset
    }

    const range = selection.getRangeAt(0)
    // Does not work correctly on iOS when selecting nodes backwards.
    // https://bugs.webkit.org/show_bug.cgi?id=220523
    return range.startContainer === selection.focusNode
}

/**
 * Returns true if any part of `node` lies within `range`.
 *
 * @param {Range} range
 * @param {Node} node
 */
export function isNodeInRange(range, node) {
    try {
        const length = node.nodeValue?.length ?? node.childNodes.length
        return (
            // Check start of node is before end of range.
            range.comparePoint(node, 0) <= 0 &&
            // Check end of node is after start of range.
            range.comparePoint(node, length) >= 0
        )
    } catch (e) {
        // `comparePoint` may fail if the `range` and `node` do not share a common
        // ancestor or `node` is a doctype.
        return false
    }
}

/**
 * Iterate over all Node(s) which overlap `range` in document order and invoke
 * `callback` for each of them.
 *
 * @param {Range} range
 * @param {(n: Node) => any} callback
 */
export function forEachNodeInRange(range, callback) {
    const root = range.commonAncestorContainer
    const nodeIter = /** @type {Document} */ (root.ownerDocument).createNodeIterator(
        root,
        NodeFilter.SHOW_ALL,
    )

    let currentNode
    while ((currentNode = nodeIter.nextNode())) {
        if (isNodeInRange(range, currentNode)) {
            callback(currentNode)
        }
    }
}

/**
 * Returns the bounding rectangles of non-whitespace text nodes in `range`.
 *
 * @param {Range} range
 * @return {Array<DOMRect>} Array of bounding rects in viewport coordinates.
 */
export function getTextBoundingBoxes(range) {
    const whitespaceOnly = /^\s*$/
    const textNodes = []
    forEachNodeInRange(range, function (node) {
        if (
            node.nodeType === Node.TEXT_NODE &&
            !(/** @type {string} */ (node.textContent).match(whitespaceOnly))
        ) {
            textNodes.push(node)
        }
    })

    let rects = []
    textNodes.forEach(function (node) {
        const nodeRange = node.ownerDocument.createRange()
        nodeRange.selectNodeContents(node)
        if (node === range.startContainer) {
            nodeRange.setStart(node, range.startOffset)
        }
        if (node === range.endContainer) {
            nodeRange.setEnd(node, range.endOffset)
        }
        if (nodeRange.collapsed) {
            // If the range ends at the start of this text node or starts at the end
            // of this node then do not include it.
            return
        }

        // Measure the range and translate from viewport to document coordinates
        const viewportRects = Array.from(nodeRange.getClientRects())
        nodeRange.detach()
        rects = rects.concat(viewportRects)
    })
    return rects
}

/**
 * Returns the rectangle, in viewport coordinates, for the line of text
 * containing the focus point of a Selection.
 *
 * Returns null if the selection is empty.
 *
 * @param {Selection} selection
 * @return {DOMRect|null}
 */
export function selectionFocusRect(selection) {
    if (selection.isCollapsed) {
        return null
    }
    const textBoxes = getTextBoundingBoxes(selection.getRangeAt(0))
    if (textBoxes.length === 0) {
        return null
    }

    if (isSelectionBackwards(selection)) {
        return textBoxes[0]
    } else {
        return textBoxes[textBoxes.length - 1]
    }
}

/**
 * Retrieve a set of items associated with nodes in a given range.
 *
 * An `item` can be any data that the caller wishes to compute from or associate
 * with a node. Only unique items, as determined by `Object.is`, are returned.
 *
 * @template T
 * @param {Range} range
 * @param {(n: Node) => T} itemForNode - Callback returning the item for a given node
 * @return {T[]} items
 */
export function itemsForRange(range, itemForNode) {
    const checkedNodes = new Set()
    const items = new Set()

    forEachNodeInRange(range, (node) => {
        /** @type {Node|null} */
        let current = node
        while (current) {
            if (checkedNodes.has(current)) {
                break
            }
            checkedNodes.add(current)

            const item = itemForNode(current)
            if (item) {
                items.add(item)
            }

            current = current.parentNode
        }
    })

    return [...items]
}
