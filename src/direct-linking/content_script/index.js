import { bodyLoader } from 'src/util/loader'
import { remoteFunction } from 'src/util/webextensionRPC'
import * as rendering from './rendering'
import * as interactions from './interactions'

export async function init() {
    await bodyLoader()
    remoteFunction('followAnnotationRequest')()
}

browser.runtime.onMessage.addListener(request => {
    if (request.type !== 'direct-link') {
        return
    }

    ;(async () => {
        await rendering.highlightAnnotation({ annotation: request.annotation })
        interactions.scrollToHighlight()
    })()
})

init()
