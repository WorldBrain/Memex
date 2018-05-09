import { bodyLoader } from 'src/util/loader'
import { remoteFunction } from '../util/webextensionRPC'
import * as rendering from './rendering'

export async function init() {
    await bodyLoader()
    remoteFunction('followAnnotationRequest')()
}

browser.runtime.onMessage.addListener(request => {
    if (request.type !== 'direct-link') {
        return
    }

    rendering.highlightAnnotation({ annotation: request.annotation })
})

init()
