import scrollToElement from 'scroll-to-element'
import { remoteFunction } from 'src/util/webextensionRPC'
import * as annotations from './annotations'

export async function createDirectLink() {
    const url = window.location.href
    const anchor = await extractAnchor()
    return await remoteFunction('createDirectLink')({ url, anchor })
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
