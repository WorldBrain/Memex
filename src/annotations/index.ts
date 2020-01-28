import { remoteFunction } from 'src/util/webextensionRPC'
import { renderHighlights } from 'src/highlighting/ui/highlight-interactions'
import { createHighlight } from 'src/highlighting/ui'
import { toggleSidebarOverlay } from 'src/sidebar-overlay/utils'

export const fetchAnnotationsAndHighlight = async () => {
    const annotationList = await remoteFunction('getAllAnnotationsByUrl')({
        url: window.location.href,
    })
    const highlightables = annotationList.filter(
        annotation => annotation.selector,
    )
    renderHighlights(highlightables, toggleSidebarOverlay)
}
export const openSidebarToAnnotateSelection = async (selection?: any) => {
    const highlight = await createHighlight(selection, true)
    await toggleSidebarOverlay({ anchor: highlight.selector, override: true })
}
