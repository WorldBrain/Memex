import { remoteFunction } from 'src/util/webextensionRPC'
import { createHighlight } from 'src/highlighting/ui'
import { toggleSidebarOverlay } from 'src/sidebar-overlay/utils'
import { renderHighlights } from 'src/highlighting/ui/highlight-interactions'

// TODO (ch - annotations): If this function is doing to work of getting all the annotations for a tab,
// TODO (ch - annotations): it can at least also provide it for the annotations in the side bar.
export const fetchAnnotationsAndHighlight = async () => {
    const annotationList = await remoteFunction('getAllAnnotationsByUrl')({
        url: window.location.href,
    })
    const highlightables = annotationList.filter(
        annotation => annotation.selector,
    )
    renderHighlights(highlightables, toggleSidebarOverlay)
    return highlightables
}

export const createAnnotationDraftInSidebar = async (selection?: any) => {
    const highlight = await createHighlight(selection, true)
    await toggleSidebarOverlay({ anchor: highlight.selector, override: true })
    return highlight
}

// FIXME (ch - annotations): Type for selection
export const createAnnotationHighlight = async (selection?: any) => {
    const highlight = await createHighlight(selection)
    // FIXME (ch - annotations): Fix this to a typed remote function version
    await remoteFunction('createAnnotation')(highlight)
    return highlight
}
