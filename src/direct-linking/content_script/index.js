import { bodyLoader } from 'src/util/loader'
import { remoteFunction } from 'src/util/webextensionRPC'
import * as rendering from './rendering'
import * as interactions from 'src/sidebar-overlay/content_script/highlight-interactions'

export async function init() {
    await bodyLoader()
    setTimeout(() => {
        remoteFunction('followAnnotationRequest')()
    }, 500)
}

export function setupAnchorFallbackOverlay() {}

browser.runtime.onMessage.addListener(request => {
    if (request.type !== 'direct-link') {
        return
    }

    ;(async () => {
        const highlightSuccessful = await rendering.highlightAnnotation({
            annotation: request.annotation,
        })
        if (highlightSuccessful) {
            interactions.makeHighlightDark(request.annotation)
            interactions.scrollToHighlight(request.annotation)
        } else {
            setupAnchorFallbackOverlay()
        }
    })()
})

init()
