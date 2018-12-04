import { browser } from 'webextension-polyfill-ts'
import { remoteFunction, makeRemotelyCallable } from '../util/webextensionRPC'
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
        destroyTooltip: async () => {
            interactions.destroyTooltipTrigger()
            destroyUIContainer(target)
            target.remove()

            const closeMessageShown = await _getCloseMessageShown()
            if (!closeMessageShown) {
                toolbarNotifications.showToolbarNotification(
                    'tooltip-first-close',
                )
                // _setCloseMessageShown()
            }
        },
    })
    interactions.setupTooltipTrigger(showTooltip)
    interactions.conditionallyTriggerTooltip(showTooltip)

    makeRemotelyCallable({
        showContentTooltip: () => {
            // console.log('called!')
            if (interactions.userSelectedText()) {
                const position = interactions.calculateTooltipPostion()
                showTooltip(position)
            }
        },
    })
}

const CLOSE_MESSAGESHOWN_KEY = 'tooltip.close-message-shown'

export async function _getCloseMessageShown() {
    await window['browser'].storage.local.set({
        [CLOSE_MESSAGESHOWN_KEY]: true,
    })
}

export async function _setCloseMessageShown() {
    const { [CLOSE_MESSAGESHOWN_KEY]: closeMessageShown } = await window[
        'browser'
    ].storage.local.get({ [CLOSE_MESSAGESHOWN_KEY]: false })

    return closeMessageShown
}
