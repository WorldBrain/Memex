import browser from 'webextension-polyfill'

import analytics from 'src/analytics'
import { delayed, getPositionState } from '../utils'
import { setupUIContainer, destroyUIContainer } from './components'
import {
    conditionallyRemoveOnboardingSelectOption,
    conditionallyShowHighlightNotification,
} from '../onboarding-interactions'
import type { TooltipPosition } from '@worldbrain/memex-common/lib/in-page-ui/tooltip/types'
import type { TooltipDependencies } from 'src/in-page-ui/tooltip/types'
import type { InPageUIRootMount } from 'src/in-page-ui/types'
import { STAGES } from 'src/overview/onboarding/constants'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import type { Shortcut } from 'src/in-page-ui/keyboard-shortcuts/types'
import type { SharedInPageUIEvents } from 'src/in-page-ui/shared-state/types'
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
let target: HTMLElement = null
let showTooltip = null

/* Denotes whether the user inserted/removed tooltip themselves. */
let manualOverride = false

let removeTooltipStateChangeListener: () => void

interface TooltipInsertDependencies extends TooltipDependencies {
    mount: InPageUIRootMount
}

/**
 * Creates target container for Tooltip.
 * Injects content_script.css.
 * Mounts Tooltip React component.
 * Sets up Container <---> webpage Remote functions.
 */
export const insertTooltip = async (params: TooltipInsertDependencies) => {
    // If target is set, Tooltip has already been injected.
    if (target) {
        return
    }

    target = params.mount.rootElement
    showTooltip = await setupUIContainer(
        params.mount,
        {
            getWindow: () => window,
            createAnnotation: async (...args) => {
                await params.createAnnotation(...args)
                await conditionallyRemoveOnboardingSelectOption(
                    STAGES.annotation.annotationCreated,
                )
            },
            createHighlight: async (...args) => {
                return await params.createHighlight(...args)
            },
            askAI: params.askAI,
            getKBShortcuts: async () => {
                const state = await getKeyboardShortcutsState()
                const shortcutToKeyStrs = ({ shortcut }: Shortcut): string[] =>
                    shortcut.split('+')
                return {
                    createAnnotation: shortcutToKeyStrs(state.createAnnotation),
                    createHighlight: shortcutToKeyStrs(state.createHighlight),
                    addToCollection: shortcutToKeyStrs(state.addToCollection),
                    copyCurrentLink: shortcutToKeyStrs(state.copyCurrentLink),
                    askAI: shortcutToKeyStrs(state.askAI),
                }
            },
            onTooltipHide: () => params.inPageUI.hideTooltip(),
            onTooltipClose: () => params.inPageUI.removeTooltip(),
            onExternalDestroy: (destroyTooltip) => {
                const handleUIStateChange: SharedInPageUIEvents['stateChanged'] = (
                    event,
                ) => {
                    if (!('tooltip' in event.changes)) {
                        return
                    }

                    if (!event.newState.tooltip) {
                        analytics.trackEvent({
                            category: 'InPageTooltip',
                            action: 'closeTooltip',
                        })
                        destroyTooltip()
                    }
                }

                params.inPageUI.events?.on('stateChanged', handleUIStateChange)
                removeTooltipStateChangeListener = () =>
                    params.inPageUI.events?.removeListener(
                        'stateChanged',
                        handleUIStateChange,
                    )
            },
            getHighlightColorsSettings: () =>
                params.getHighlightColorsSettings(),
            saveHighlightColorsSettings: (newStateInput) =>
                params.saveHighlightColorsSettings(newStateInput),
            openPDFinViewer: (url) => params.openPDFinViewer(url),
            getRootElement: () => target,
            imageSupportBG: params.imageSupportBG,
            setCurrentAnnotation: () => {}, // Placeholder function
            saveAnnotation: async () => {}, // Placeholder async function
            renderSpacePicker: () => null, // Placeholder function returning nullr empty object
            analyticsBG: params.analyticsBG,
            openAnnotationEdit: (openTooltipInAnnotationEditMode) => {
                const handleExternalAction = (event) => {
                    openTooltipInAnnotationEditMode(
                        event.annotationCacheId,
                        event.selection,
                        event.openForSpaces,
                    )
                }
                params.inPageUI.events.on('tooltipAction', handleExternalAction)
            },
            currentAnnotation: null, // Adjust based on your needs
            getAnnotationData: async (annotationId: string) => {
                // Placeholder function, replace with actual implementation
                return {}
            },
            getAnnotationLists: async () => {
                // Placeholder function, replace with actual implementation
                return []
            },
            toggleSpacePicker: (spaceId: string) => {
                return
            },
            removeSpaceForAnnotation: (listId: number) => {
                return // Placeholder function, replace with actual implementation
            },
        },
        {
            annotationsBG: params.annotationsBG,
            annotationsCache: params.annotationsCache,
            analyticsBG: params.analyticsBG,
            contentSharingBG: params.contentSharingBG,
            authBG: params.authBG,
            spacesBG: params.spacesBG,
            bgScriptsBG: params.bgScriptsBG,
            pageActivityIndicatorBG: params.pageActivityIndicatorBG,
            localStorageAPI: params.localStorageAPI,
            getRootElement: () => target,
        },
    )

    setupTooltipTrigger(() => {
        params.inPageUI.showTooltip()
    }, null)
    conditionallyTriggerTooltip({
        callback: () => params.inPageUI.showTooltip(),
    })
}

export const removeTooltip = (options?: { override?: boolean }) => {
    manualOverride = !!options?.override

    if (!target) {
        return
    }

    removeTooltipStateChangeListener?.()
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

export const showContentTooltip = async (params: TooltipInsertDependencies) => {
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
        // const positioning = await getPositionState()
        let position: TooltipPosition
        // if (positioning === 'text' || !event) {
        //     position = calculateTooltipPostion()
        // } else if (positioning === 'mouse' && event) {
        //     position = calculateTooltipPostion()
        // }
        position = calculateTooltipPostion()
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
    10,
)

export function calculateTooltipPostion(): TooltipPosition {
    const range = document.getSelection().getRangeAt(0)
    const boundingRect = range.getBoundingClientRect()
    // x = position of element from the left + half of it's width
    const x = boundingRect.left + boundingRect.width / 2
    // y = scroll height from top + pixels from top + height of element - offset
    const y = window.pageYOffset + boundingRect.top + boundingRect.height
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
    const $tooltipContainer = document.querySelector('#memex-tooltip-container')
    if (!$tooltipContainer) {
        // edge case, where the destroy() is called
        return true
    }
    return $tooltipContainer.contains(event.target)
}
