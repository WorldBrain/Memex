import { bodyLoader } from 'src/util/loader'
import * as interactions from './interactions'
import { injectCSS } from 'src/search-injection/dom'

export async function init() {
    await bodyLoader()

    const target = document.createElement('div')
    target.setAttribute('id', 'memex-direct-linking-tooltip')
    document.body.appendChild(target)

    const cssFile = browser.extension.getURL('/content_script.css')
    injectCSS(cssFile)

    const showTooltip = await interactions.setupUIContainer(target)
    interactions.setupTooltipTrigger(showTooltip)
}

init()
