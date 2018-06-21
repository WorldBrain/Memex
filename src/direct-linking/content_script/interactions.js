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

export function scrollToHighlight() {
    const $highlight = document.querySelector('.' + styles['memex-highlight'])
    if ($highlight) {
        setTimeout(() => {
            scrollToElement($highlight, { offset: -225 })
        }, 300)
    } else {
        console.error('MEMEX: Oops, no highlight found to scroll to')
    }
}
