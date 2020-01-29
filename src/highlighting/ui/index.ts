import { Annotation } from 'src/sidebar-overlay/sidebar/types'
import { remoteFunction } from 'src/util/webextensionRPC'
import { renderHighlight } from 'src/highlighting/ui/highlight-interactions'
import * as annotations from 'src/highlighting/ui/anchoring/index'
import { Anchor, Highlight } from 'src/highlighting/types'
import { toggleSidebarOverlay } from 'src/sidebar-overlay/utils'

export async function createHighlightAndSave(selection?: any) {
    // FIXME (ch - annotations): Fix this to a typed version
    await remoteFunction('createAnnotation')(await createHighlight(selection))
}

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
