import scrollToElement from 'scroll-to-element'
import { remoteFunction } from 'src/util/webextensionRPC'
import { copyToClipboard } from './utils'
import * as annotations from './annotations'

import styles from './styles.css'

export async function createAndCopyDirectLink() {
    const selection = document.getSelection()
    const range = selection.getRangeAt(0)
    const url = window.location.href

    const anchor = await extractAnchor(selection)
    const result = await remoteFunction('createDirectLink')({ url, anchor })
    copyToClipboard(result.url)
    selectTextFromRange(range)
    return result
}

export async function createAnnotation() {
    const selection = document.getSelection()
    const range = selection.getRangeAt(0)

    const anchor = await extractAnchor(selection)
    await remoteFunction('openSidebarWithHighlight')(anchor)
    selectTextFromRange(range)
}

async function extractAnchor(selection) {
    const quote = selection.toString()

    const descriptor = await annotations.selectionToDescriptor({ selection })
    return {
        quote,
        descriptor,
    }
}

function selectTextFromRange(range) {
    const selection = document.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
}

export function scrollToHighlight({ isDark }) {
    const highlightClass = isDark ? 'memex-highlight-dark' : 'memex-highlight'
    const $highlight = document.querySelector('.' + styles[highlightClass])
    if ($highlight) {
        setTimeout(() => {
            scrollToElement($highlight, { offset: -225 })
        }, 300)
    } else {
        console.error('MEMEX: Oops, no highlight found to scroll to')
    }
}

export function removeHighlights({ isDark }) {
    const highlightClass = isDark ? 'memex-highlight-dark' : 'memex-highlight'
    const className = styles[highlightClass]
    const highlights = document.querySelectorAll('.' + className)
    highlights.forEach(highlight => highlight.classList.remove(className))
}
