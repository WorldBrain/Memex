import { remoteFunction } from 'src/util/webextensionRPC'
import { toggleSidebarOverlay } from 'src/sidebar-overlay/utils'
import {
    renderHighlightFromSelection,
    renderHighlights,
} from 'src/highlighting/ui/highlight-interactions'

// export const highlightAnnotations = async (annotationList = null) => {
//     annotationList =
//         annotationList ||
//         (await remoteFunction('getAllAnnotationsByUrl')({
//             url: window.location.href,
//         }))
//
//     const highlightables = annotationList.filter(
//         annotation => annotation.selector,
//     )
//     renderHighlights(highlightables, toggleSidebarOverlay)
//     return annotationList
// }
//
// export const createAnnotationDraftInSidebar = async (selection?: any) => {
//     const highlight = await createAndRenderHighlightFromSelection(selection, true)
//     await toggleSidebarOverlay({
//         anchor: highlight.selector,
//         override: true,
//         openSidebar: true,
//     })
//     return highlight
// }
