import { bodyLoader } from 'src/util/loader'
import { OPEN_OPTIONS } from 'src/search-injection/constants'
import { createAndCopyDirectLink } from 'src/direct-linking/content_script/interactions'
import setupUIContainer from './components'
import * as interactions from './interactions'
import { injectCSS } from 'src/search-injection/dom'

export async function init() {
    await bodyLoader()

    const target = document.createElement('div')
    target.setAttribute('id', 'memex-direct-linking-tooltip')
    document.body.appendChild(target)

    const cssFile = browser.extension.getURL('/content_script.css')
    injectCSS(cssFile)

    const showTooltip = await setupUIContainer(target, {
        createAndCopyDirectLink,
        openSettings: () => {
            const message = {
                action: OPEN_OPTIONS,
                query: 'settings',
            }
            browser.runtime.sendMessage(message)
        },
    })
    interactions.setupTooltipTrigger(showTooltip)
}

init()
