import * as annotations from 'src/highlighting/ui/anchoring/index'
import { Anchor, Highlight } from 'src/highlighting/types'
import { toggleSidebarOverlay } from 'src/sidebar-overlay/utils'
import { Annotation } from 'src/annotations/types'
import { renderHighlight } from 'src/highlighting/ui/highlight-interactions'

export async function createHighlight(selection?: any, temporary = false) {
    const url = window.location.href
    const title = document.title

    const anchor = await extractAnchor(selection || document.getSelection())
    const body = anchor ? anchor.quote : ''

    const highlight = {
        url,
        title,
        comment: '',
        tags: [],
        body,
        selector: anchor,
    } as Partial<Annotation>

    renderHighlight(
        highlight as Highlight,
        undefined,
        undefined,
        toggleSidebarOverlay,
        temporary,
    )

    return highlight
}

export const extractAnchor = async (selection: Selection): Promise<Anchor> => {
    const quote = selection.toString()

    const descriptor = await annotations.selectionToDescriptor({ selection })
    return {
        quote,
        descriptor,
    }
}
