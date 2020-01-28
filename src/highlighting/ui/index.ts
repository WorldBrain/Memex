import { Annotation } from 'src/sidebar-overlay/sidebar/types'
import { remoteFunction } from 'src/util/webextensionRPC'
import {
    renderHighlight,
    renderHighlights,
} from 'src/highlighting/ui/highlight-interactions'
import { toggleSidebarOverlay } from 'src/direct-linking/content_script/interactions'
import * as annotations from 'src/highlighting/ui/anchoring/index'
import { Anchor, Highlight } from 'src/highlighting/types'

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
    renderHighlights(highlightables, toggleSidebarOverlay)
}

export async function renderHighlightAndCreateAnnotation(selection?: any) {
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

    renderHighlight(
        annotation as Highlight,
        undefined,
        undefined,
        toggleSidebarOverlay,
    )

    // FIXME (ch - annotations): Fix this to a typed version
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
export const selectTextFromRange = (range: Range) => {
    const selection = document.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
}
