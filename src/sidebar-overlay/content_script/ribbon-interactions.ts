import retargetEvents from 'react-shadow-dom-retarget-events'
import { browser } from 'webextension-polyfill-ts'

import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { setupRibbonAndSidebarUI, destroyRibbonAndSidebarUI } from '..'
import { getSidebarState } from '../utils'
import { getTooltipState } from 'src/content-tooltip/utils'
import { createRootElement, destroyRootElement } from './rendering'
import { removeHighlights } from './highlight-interactions'
// import { setTooltipState, getTooltipState } from '../../content-tooltip/utils'
// import {
//     removeTooltip,
//     insertTooltip,
// } from '../../content-tooltip/interactions'

let target = null /* Target container for the Ribbon. */
let shadowRoot = null /* Root of the shadow DOM in which ribbon is inserted. */
let toggleSidebar = null /* Promise that resolves to toggling the sidebar. */

/**
 * Reference to the actual Ribbon component. Useful for updating the state of
 * the ribbon from outside the component.
 */
let ribbonRef = null

/* Denotes whether the user inserted/removed ribbon by his/her own self. */
let manualOverride = false

/**
 * Creates target container for Ribbon and Sidebar shadow DOM.
 * Injects content_script.css.
 * Mounts Ribbon React component.
 * Sets up shadow DOM <--> webpage Remote functions.
 *
 * If ribbon is already inserted, then updates the ribbon.
 */
export const insertRibbon = async ({
    annotationsManager,
    toolbarNotifications,
}) => {
    // If target is set, Ribbon has already been injected.
    if (target) {
        await updateRibbon()
        return
    }

    const { shadow, rootElement } = createRootElement({
        containerId: 'memex-ribbon-sidebar-container',
        rootId: 'memex-ribbon-sidebar',
        classNames: ['memex-ribbon-sidebar'],
    })
    target = rootElement
    shadowRoot = shadow

    // React messes up event propagation with shadow dom, hence fix.
    retargetEvents(shadowRoot)

    // TODO: Refactor ribbon removal to a different manager.
    setupRibbonAndSidebarUI(target, {
        annotationsManager,
        handleRemoveRibbon: async () => {
            manualOverride = true
            removeRibbon()

            const closeMessageShown = await _getCloseMessageShown()
            if (!closeMessageShown) {
                toolbarNotifications.showToolbarNotification(
                    'ribbon-first-close',
                )
                _setCloseMessageShown()
            }
        },
    })
    // setupRibbonUI(target, {
    //     onInit: ({ toggleSidebar }) => {
    //         resolveToggleSidebar(toggleSidebar)
    //     },
    //     getInitialState: async () => {
    //         const isTooltipEnabled = await getTooltipState()
    //         const isRibbonEnabled = await getSidebarState()
    //         return { isTooltipEnabled, isRibbonEnabled }
    //     },
    //     handleRibbonToggle: async prevState => {
    //         await setSidebarState(!prevState)
    //     },
    //     handleTooltipToggle: async isTooltipEnabled => {
    //         if (isTooltipEnabled) {
    //             removeTooltip()
    //         } else {
    //             await insertTooltip({ toolbarNotifications })
    //         }
    //         await setTooltipState(!isTooltipEnabled)
    //     },
    //     setRibbonRef: ribbon => {
    //         ribbonRef = ribbon
    //     },
    // })
}

/**
 * Removes the ribbon and sidebar from the DOM (if it is present) after
 * removing the highlights from the page. Also destroys the container.
 */
const removeRibbon = () => {
    if (!target) {
        return
    }
    removeHighlights()
    destroyRibbonAndSidebarUI(target, shadowRoot)
    destroyRootElement()
    shadowRoot = null
    target = null
    toggleSidebar = null
    ribbonRef = null
}

/**
 * Inserts or removes ribbon from the page (if not overridden manually).
 * Should either be called through the RPC, or pass the `toolbarNotifications`
 * wrapped in an object.
 */
const insertOrRemoveRibbon = async ({
    annotationsManager,
    toolbarNotifications,
}) => {
    if (manualOverride) {
        return
    }

    const isRibbonEnabled = await getSidebarState()
    const isRibbonPresent = !!target

    if (isRibbonEnabled && !isRibbonPresent) {
        insertRibbon({ annotationsManager, toolbarNotifications })
    } else if (!isRibbonEnabled && isRibbonPresent) {
        removeRibbon()
    }
}

/**
 * Updates the ribbon state if it is present.
 * Fetches whether the sidebar and tooltip are enabled.
 * Tells the ribbon to update its state with those values.
 */
const updateRibbon = async () => {
    if (!target) {
        return
    }

    // Get ribbon and tooltip state.
    const isRibbonEnabled = await getSidebarState()
    const isTooltipEnabled = await getTooltipState()

    // TODO: Find a solution for this.
    if (ribbonRef && ribbonRef.getInstance()) {
        ribbonRef
            .getInstance()
            .updateState({ isRibbonEnabled, isTooltipEnabled })
    }
}

/**
 * Setups up RPC functions for the ribbon.
 */
export const setupRPC = ({ annotationsManager, toolbarNotifications }) => {
    makeRemotelyCallable({
        /**
         * Used for inserting the ribbon.
         */
        insertRibbon: ({ override } = { override: false }) => {
            manualOverride = !!override
            insertRibbon({ annotationsManager, toolbarNotifications })
        },
        /**
         * Used for removing the ribbon.
         */
        removeRibbon: ({ override } = { override: false }) => {
            manualOverride = !!override
            removeRibbon()
        },
        /**
         * Inserts or removes the ribbon from the page depending on whether it
         * is enabled or not.
         */
        insertOrRemoveRibbon: async () => {
            await insertOrRemoveRibbon({
                annotationsManager,
                toolbarNotifications,
            })
        },
        /**
         * RPC for updating the ribbon's state.
         */
        updateRibbon,
    })
}

const CLOSE_MESSAGESHOWN_KEY = 'ribbon.close-message-shown'

const _setCloseMessageShown = async () => {
    await browser.storage.local.set({
        [CLOSE_MESSAGESHOWN_KEY]: true,
    })
}

const _getCloseMessageShown = async () => {
    const {
        [CLOSE_MESSAGESHOWN_KEY]: closeMessageShown,
    } = await browser.storage.local.get({ [CLOSE_MESSAGESHOWN_KEY]: false })

    return closeMessageShown
}
