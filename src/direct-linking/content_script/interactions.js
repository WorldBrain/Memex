import scrollToElement from 'scroll-to-element'
import { remoteFunction } from 'src/util/webextensionRPC'
import { copyToClipboard } from './utils'
import * as annotations from './annotations'

export async function createAndCopyDirectLink() {
    const url = window.location.href
    const anchor = await extractAnchor()
    const result = await remoteFunction('createDirectLink')({ url, anchor })
    copyToClipboard(result.url)
    return result
}

async function extractAnchor() {
    const selection = document.getSelection()
    const descriptor = await annotations.selectionToDescriptor({ selection })
    return {
        quote: selection.toString(),
        descriptor,
    }
}

export function scrollToHighlight() {
    const $highlight = document.querySelector('.memex-highlight')
    if ($highlight) {
        setTimeout(() => {
            scrollToElement($highlight)
        }, 300)
    } else {
        console.error('Oops, no highlight found to scroll to')
    }
}
