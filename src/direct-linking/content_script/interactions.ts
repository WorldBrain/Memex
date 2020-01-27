import { remoteFunction } from '../../util/webextensionRPC'
import { copyToClipboard } from './utils'
import * as annotations from './annotations'
import { highlightAnnotations } from '../../sidebar-overlay/content_script/highlight-interactions'
import { highlightAnnotation } from 'src/direct-linking/content_script/rendering'
import { Annotation } from 'src/sidebar-overlay/sidebar/types'

export interface Anchor {
    quote: string
    descriptor: {
        strategy: string
        content: any
    }
}

export const toggleSidebarOverlay = remoteFunction('toggleSidebarOverlay')

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

export const createAnnotation = async (selection?: any) => {
    const range = selection.getRangeAt(0)

    const anchor = await extractAnchor(selection || document.getSelection())
    await toggleSidebarOverlay({ anchor, override: true })
    selectTextFromRange(range)
}

const fetchAndHighlightAnnotations = async () => {
    const annotationList = await remoteFunction('getAllAnnotationsByUrl')({
        url: window.location.href,
    })
    const highlightables = annotationList.filter(
        annotation => annotation.selector,
    )
    highlightAnnotations(highlightables, toggleSidebarOverlay)
}
export async function createHighlight(selection?: any) {
    const url = window.location.href
    const title = document.title

    const anchor = await extractAnchor(selection || document.getSelection())
    const body = anchor ? anchor.quote : ''

    const annotation = {
        url,
        title,
        comment: '',
        tags: [],
        body,
        selector: anchor,
    } as Partial<Annotation>
    highlightAnnotation({ annotation }, false)
    await remoteFunction('createAnnotation')(annotation)
}

export const extractAnchor = async (selection: Selection): Promise<Anchor> => {
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
