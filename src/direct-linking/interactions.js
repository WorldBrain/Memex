import scrollToElement from 'scroll-to-element'
import * as annotations from './annotations'
import * as backend from './backend'

export async function createDirectLink() {
    const url = window.location.href
    const anchor = await extractAnchor()
    return backend.createAnnotationLink({ url, anchor })
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
