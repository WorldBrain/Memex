import scrollToElement from 'scroll-to-element'
import { remoteFunction } from 'src/util/webextensionRPC'
import { copyToClipboard } from './utils'
import * as annotations from './annotations'

import styles from './styles.css'

export async function createAndCopyDirectLink() {
    const url = window.location.href
    const anchor = await extractAnchor()
    const result = await remoteFunction('createDirectLink')({ url, anchor })
    copyToClipboard(result.url)
    return result
}

async function extractAnchor() {
    const selection = document.getSelection()
    const quote = selection.toString()

    const descriptor = await annotations.selectionToDescriptor({ selection })
    return {
        quote,
        descriptor,
    }
}

export function scrollToHighlight() {
    const $highlight = document.querySelector('.' + styles['memex-highlight'])
    if ($highlight) {
        setTimeout(() => {
            scrollToElement($highlight, { offset: -125 })
        }, 300)
    } else {
        console.error('Oops, no highlight found to scroll to')
    }
}
