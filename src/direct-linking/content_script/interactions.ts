import { remoteFunction } from '../../util/webextensionRPC'
import { copyToClipboard } from './utils'
import * as annotations from './annotations'

export interface Anchor {
    quote: string
    descriptor: {
        strategy: string
        content: any
    }
}

export const createAndCopyDirectLink = async () => {
    const selection = document.getSelection()
    const range = selection.getRangeAt(0)
    const url = window.location.href

    const anchor = await extractAnchor(selection)
    const result: { url: string } = await remoteFunction('createDirectLink')({
        url,
        anchor,
    })
    copyToClipboard(result.url)
    selectTextFromRange(range)
    return result
}

export const createAnnotation = async () => {
    const selection = document.getSelection()
    const range = selection.getRangeAt(0)

    const anchor = await extractAnchor(selection)
    await remoteFunction('openSidebarWithHighlight')(anchor)
    selectTextFromRange(range)
}

const extractAnchor = async (selection: Selection): Promise<Anchor> => {
    const quote = selection.toString()

    const descriptor = await annotations.selectionToDescriptor({ selection })
    return {
        quote,
        descriptor,
    }
}

const selectTextFromRange = (range: Range) => {
    const selection = document.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
}
