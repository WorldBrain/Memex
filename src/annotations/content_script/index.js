import { bodyLoader } from 'src/util/loader'
import { remoteFunction } from 'src/util/webextensionRPC'

export async function loadAnnotationWhenReady() {
    await bodyLoader()
    setTimeout(() => {
        remoteFunction('followAnnotationRequest')()
    }, 500)
}

export function setupAnchorFallbackOverlay() {}

export function setupRemoteDirectLinkFunction({ highlightRenderer }) {
    browser.runtime.onMessage.addListener((request) => {
        if (request.type !== 'direct-link') {
            return
        }

        ;(async () => {
            const highlightSuccessful = await highlightRenderer.renderHighlight(
                request,
            )
            if (highlightSuccessful) {
                highlightRenderer.makeHighlightDark(request.annotation)
                highlightRenderer.scrollToHighlight(request.annotation)
            } else {
                setupAnchorFallbackOverlay()
            }
        })()
    })
}
