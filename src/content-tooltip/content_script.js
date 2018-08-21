import { remoteFunction } from 'src/util/webextensionRPC'
import { bodyLoader } from 'src/util/loader'
import {
    createAndCopyDirectLink,
    createAnnotation,
} from 'src/direct-linking/content_script/interactions'
import { setupUIContainer, destroyUIContainer } from './components'
import * as interactions from './interactions'
import { injectCSS } from 'src/search-injection/dom'

const openOptionsRPC = remoteFunction('openOptionsTab')

export async function init() {
    await bodyLoader()

    const target = document.createElement('div')
    target.setAttribute('id', 'memex-direct-linking-tooltip')
    document.body.appendChild(target)

    const cssFile = browser.extension.getURL('/content_script.css')
    injectCSS(cssFile)

    const showTooltip = await setupUIContainer(target, {
        createAndCopyDirectLink,
        createAnnotation,
        openSettings: () => openOptionsRPC('settings'),
        destroyTooltip: () => {
            interactions.destroyTooltipTrigger()
            destroyUIContainer(target)
            target.remove()
        },
    })
    interactions.setupTooltipTrigger(showTooltip)
}

init()
