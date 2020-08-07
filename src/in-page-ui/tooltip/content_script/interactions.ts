import { browser } from 'webextension-polyfill-ts'

import analytics from 'src/analytics'
import { delayed, getPositionState } from '../utils'
import { createAndCopyDirectLink } from '../../../annotations/content_script/interactions'
import { setupUIContainer, destroyUIContainer } from './components'
import { remoteFunction } from '../../../util/webextensionRPC'
import { injectCSS } from '../../../util/content-injection'
import { conditionallyShowHighlightNotification } from '../onboarding-interactions'
import { TooltipPosition } from '../types'
import { TooltipDependencies } from 'src/in-page-ui/tooltip/types'

const openOptionsRPC = remoteFunction('openOptionsTab')
let mouseupListener = null

export function setupTooltipTrigger(
    callback: (position: TooltipPosition) => void,
    toolbarNotifications,
) {
    mouseupListener = (event) => {
        conditionallyTriggerTooltip({ callback, toolbarNotifications }, event)
    }

    document.body.addEventListener('mouseup', mouseupListener)
}

export function destroyTooltipTrigger() {
    document.body.removeEventListener('mouseup', mouseupListener)
    mouseupListener = null
}

const CLOSE_MESSAGESHOWN_KEY = 'tooltip.close-message-shown'

async function _setCloseMessageShown() {
    await browser.storage.local.set({
        [CLOSE_MESSAGESHOWN_KEY]: true,
    })
}

async function _getCloseMessageShown() {
    const {
        [CLOSE_MESSAGESHOWN_KEY]: closeMessageShown,
    } = await browser.storage.local.get({ [CLOSE_MESSAGESHOWN_KEY]: false })

    return closeMessageShown
}

// Target container for the Tooltip.
let target = null
let showTooltip = null

/* Denotes whether the user inserted/removed tooltip themselves. */
let manualOverride = false

/**
 * Creates target container for Tooltip.
 * Injects content_script.css.
 * Mounts Tooltip React component.
 * Sets up Container <---> webpage Remote functions.
 */
export const insertTooltip = async (params: TooltipDependencies) => {
    // If target is set, Tooltip has already been injected.
    if (target) {
        return
    }

    target = document.createElement('div')
    target.setAttribute('id', 'memex-direct-linking-tooltip')
    document.body.appendChild(target)

    const cssFile = browser.extension.getURL('/content_script.css')
    injectCSS(cssFile)

    showTooltip = await setupUIContainer(target, {
        inPageUI: params.inPageUI,
        createAndCopyDirectLink,
        createAnnotation: params.createAnnotation,
        createHighlight: params.createHighlight,
        openSettings: () => openOptionsRPC('settings'),
        destroyTooltip: async () => {
            analytics.trackEvent({
                category: 'InPageTooltip',
                action: 'closeTooltip',
            })
            manualOverride = true
            removeTooltip()

            const closeMessageShown = await _getCloseMessageShown()
            if (!closeMessageShown) {
                params.toolbarNotifications.showToolbarNotification(
                    'tooltip-first-close',
                    {},
                )
                _setCloseMessageShown()
            }
        },
    })

    setupTooltipTrigger(() => {
        params.inPageUI.showTooltip()
    }, params.toolbarNotifications)
    conditionallyTriggerTooltip({
        callback: () => params.inPageUI.showTooltip(),
        toolbarNotifications: params.toolbarNotifications,
    })
}

export const removeTooltip = (options?: { override?: boolean }) => {
    manualOverride = !!options?.override

    if (!target) {
        return
    }
    destroyTooltipTrigger()
    destroyUIContainer(target)
    target.remove()

    target = null
    showTooltip = null
}

/**
 * Inserts or removes tooltip from the page (if not overridden manually).
 * Should either be called through the RPC, or pass the `toolbarNotifications`
 * wrapped in an object.
 */
// const insertOrRemoveTooltip = async (params: {
//     toolbarNotifications: any
//     inPageUI: InPageUIInterface
//     annotationsManager: AnnotationsManagerInterface
// }) => {
//     if (manualOverride) {
//         return
//     }

//     const isTooltipEnabled = await getTooltipState()
//     const isTooltipPresent = !!target

//     if (isTooltipEnabled && !isTooltipPresent) {
//         insertTooltip(params)
//     } else if (!isTooltipEnabled && isTooltipPresent) {
//         removeTooltip()
//     }
// }

/**
 * Sets up RPC functions to insert and remove Tooltip from Popup.
 */
// export const setupRPC = (params: {
//     toolbarNotifications: any
//     inPageUI: InPageUIInterface
// }) => {
// makeRemotelyCallableType<TooltipInteractionInterface>({
//     showContentTooltip: async () => {
//     },
//     insertTooltip: async ({ override } = {}) => {
//         manualOverride = !!override
//         await insertTooltip(params)
//     },
//     removeTooltip: async ({ override } = {}) => {
//         manualOverride = !!override
//         await removeTooltip()
//     },
//     insertOrRemoveTooltip: async () => {
//         await insertOrRemoveTooltip(params)
//     },
// })
// }

export const showContentTooltip = async (params: TooltipDependencies) => {
    if (!showTooltip) {
        await insertTooltip(params)
    }

    if (userSelectedText()) {
        const position = calculateTooltipPostion()
        showTooltip(position)
    }
}

/**
 * Checks for certain conditions before triggering the tooltip.
 * i) Whether the selection made by the user is just text.
 * ii) Whether the selected target is not inside the tooltip itself.
 *
 * Event is undefined in the scenario of user selecting the text before the
 * page has loaded. So we don't need to check for condition ii) since the
 * tooltip wouldn't have popped up yet.
 */
export const conditionallyTriggerTooltip = delayed(
    async (
        {
            callback,
            toolbarNotifications,
        }: {
            callback: (position: TooltipPosition) => void
            toolbarNotifications: any
        },
        event,
    ) => {
        if (!userSelectedText() || (event && isTargetInsideTooltip(event))) {
            return
        }

        /*
    If all the conditions passed, then this returns the position to anchor the
    tooltip. The positioning is based on the user's preferred method. But in the
    case of tooltip popping up before page load, it resorts to text based method
    */
        const positioning = await getPositionState()
        let position: TooltipPosition
        if (positioning === 'text' || !event) {
            position = calculateTooltipPostion()
        } else if (positioning === 'mouse' && event) {
            position = { x: event.pageX, y: event.pageY }
        }

        analytics.trackEvent({
            category: 'InPageTooltip',
            action: 'showTooltip',
        })
        callback(position)

        conditionallyShowHighlightNotification({
            toolbarNotifications,
            position,
        })
    },
    300,
)

export function calculateTooltipPostion(): TooltipPosition {
    const range = document.getSelection().getRangeAt(0)
    const boundingRect = range.getBoundingClientRect()
    // x = position of element from the left + half of it's width
    const x = boundingRect.left + boundingRect.width / 2
    // y = scroll height from top + pixels from top + height of element - offset
    const y = window.pageYOffset + boundingRect.top + boundingRect.height - 10
    return {
        x,
        y,
    }
}

function isAnchorOrContentEditable(selected) {
    // Returns true if the any of the parent is an anchor element
    // or is content editable.
    let parent = selected.parentElement
    while (parent) {
        if (parent.contentEditable === 'true' || parent.nodeName === 'A') {
            return true
        }
        parent = parent.parentElement
    }
    return false
}

export function userSelectedText() {
    const selection = document.getSelection()
    if (selection.type === 'None') {
        return false
    }

    const selectedString = selection.toString().trim()
    const container = selection.getRangeAt(0).commonAncestorContainer
    const extras = isAnchorOrContentEditable(container)

    const userSelectedTextString =
        !!selection && !selection.isCollapsed && !!selectedString && !extras
    return userSelectedTextString
}

function isTargetInsideTooltip(event) {
    const $tooltipContainer = document.querySelector(
        '#memex-direct-linking-tooltip',
    )
    if (!$tooltipContainer) {
        // edge case, where the destroy() is called
        return true
    }
    return $tooltipContainer.contains(event.target)
}
