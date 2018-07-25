import { remoteFunction } from 'src/util/webextensionRPC'
import { copyToClipboard } from './utils'
import * as annotations from './annotations'

export async function createAndCopyDirectLink() {
    const selection = document.getSelection()
    const range = selection.getRangeAt(0)
    const url = window.location.href

    const anchor = await extractAnchor(selection)
    const result = await remoteFunction('createDirectLink')({ url, anchor })
    copyToClipboard(result.link)
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
