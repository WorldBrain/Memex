import { remoteFunction } from '../../util/webextensionRPC'
import { copyToClipboard } from './utils'
import * as annotations from './annotations'
import { highlightAnnotations } from '../../sidebar-overlay/content_script/highlight-interactions'

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
    await remoteFunction('toggleSidebarOverlay')({ anchor, override: true })
    selectTextFromRange(range)
}

const fetchAndHighlightAnnotations = async () => {
    const annotationList = await remoteFunction('getAllAnnotationsByUrl')(
        window.location.href,
    )
    const highlightables = annotationList.filter(
        annotation => annotation.selector,
    )
    highlightAnnotations(highlightables)
}
export async function createHighlight() {
    const selection = document.getSelection()
    const range = selection.getRangeAt(0)
    const url = window.location.href
    const title = document.title

    const anchor = await extractAnchor(selection)
    const body = anchor ? anchor.quote : ''
    await remoteFunction('createAnnotation')({
        url,
        title,
        comment: '',
        tags: [],
        body,
        selector: anchor,
    })
    selectTextFromRange(range)
    fetchAndHighlightAnnotations()
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
