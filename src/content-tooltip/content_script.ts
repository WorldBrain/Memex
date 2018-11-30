import { browser } from 'webextension-polyfill-ts'
import { remoteFunction } from '../util/webextensionRPC'
import { bodyLoader } from '../util/loader'
import {
    createAndCopyDirectLink,
    createAnnotation,
} from '../direct-linking/content_script/interactions'
import { setupUIContainer, destroyUIContainer } from './components'
import * as interactions from './interactions'
import ToolbarNotifications from '../toolbar-notification/content_script'
import { injectCSS } from '../search-injection/dom'
import { setTooltipState } from './utils'

const openOptionsRPC = remoteFunction('openOptionsTab')

export default async function init({
    toolbarNotifications,
}: {
    toolbarNotifications: ToolbarNotifications
}) {
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
        disableTooltip: () => {
            // setTooltipState(false)
            toolbarNotifications.showToolbarNotification('tooltip-first-close')
        },
    })
    interactions.setupTooltipTrigger(showTooltip)
    interactions.conditionallyTriggerTooltip(showTooltip)
}
