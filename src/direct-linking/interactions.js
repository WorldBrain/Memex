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
