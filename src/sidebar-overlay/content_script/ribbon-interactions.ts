import retargetEvents from 'react-shadow-dom-retarget-events'
import { browser } from 'webextension-polyfill-ts'

import {
    makeRemotelyCallable,
    makeRemotelyCallableType,
} from 'src/util/webextensionRPC'
import { setupRibbonAndSidebarUI, destroyRibbonAndSidebarUI } from '..'
import { getSidebarState } from '../utils'
import { getTooltipState } from 'src/content-tooltip/utils'
import { createRootElement, destroyRootElement } from './rendering'
import AnnotationsManager from 'src/annotations/annotations-manager'
import ToolbarNotifications from 'src/toolbar-notification/content_script'
import { insertTooltip, removeTooltip } from 'src/content-tooltip/interactions'
import { RibbonInteractionsInterface } from 'src/sidebar-overlay/ribbon/types'

let target = null /* Target container for the Ribbon. */
let shadowRoot = null /* Root of the shadow DOM in which ribbon is inserted. */

/**
 * Reference to the actual RibbonSidebarController component. Useful for
 * updating the state of the ribbon from outside the component.
 */
let ribbonSidebarRef = null

/* Denotes whether the user inserted/removed ribbon by his/her own self. */
let manualOverride = false

/**
 * Creates target container for Ribbon and Sidebar shadow DOM.
 * Injects content_script.css.
 * Mounts RibbonSidebarController React component.
 *
 * If ribbon is already inserted, then updates the ribbon.
 */
export const insertRibbon = async ({
    annotationsManager,
    toolbarNotifications,
    forceExpandRibbon = false,
    store,
    ...args
}: {
    annotationsManager: AnnotationsManager
    toolbarNotifications: ToolbarNotifications
    forceExpandRibbon?: boolean
    store: any
}) => {
    // If target is set, Ribbon has already been injected.
    if (target) {
        await updateRibbon({
            openRibbon: forceExpandRibbon,
            ...args,
        })
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

    // Setup UI for Ribbon/Sidebar.
    setupRibbonAndSidebarUI(target, shadow, {
        annotationsManager,
        handleRemoveRibbon: () =>
            _removeRibbonViaRibbonCross({ toolbarNotifications }),
        insertOrRemoveTooltip: async (isTooltipEnabled: boolean) => {
            if (isTooltipEnabled) {
                removeTooltip()
            } else {
                await insertTooltip({ toolbarNotifications, store })
            }
        },
        setRibbonSidebarRef: ref => {
            ribbonSidebarRef = ref
        },
        forceExpandRibbon,
        store,
        ...args,
    })
}

const _removeRibbonViaRibbonCross = async ({
    toolbarNotifications,
}: {
    toolbarNotifications: ToolbarNotifications
}) => {
    manualOverride = true
    removeRibbon()

    const closeMessageShown = await _getCloseMessageShown()
    if (!closeMessageShown) {
        toolbarNotifications.showToolbarNotification('ribbon-first-close', null)
        _setCloseMessageShown()
    }
}

/**
 * Removes the ribbon and sidebar from the DOM (if it is present) after
 * removing the highlights from the page. Also destroys the container.
 */
export const removeRibbon = () => {
    if (!target) {
        return
    }
    destroyRibbonAndSidebarUI(target, shadowRoot)
    destroyRootElement()
    shadowRoot = null
    target = null
    ribbonSidebarRef = null
}

/**
 * Inserts or removes ribbon from the page (if not overridden manually).
 * Should either be called through the RPC, or pass the `toolbarNotifications`
 * wrapped in an object.
 */
const _insertOrRemoveRibbon = async ({
    annotationsManager,
    toolbarNotifications,
    store,
}: {
    annotationsManager: AnnotationsManager
    toolbarNotifications: ToolbarNotifications
    store: any
}) => {
    if (manualOverride) {
        return
    }

    const isRibbonEnabled = await getSidebarState()
    const isRibbonPresent = !!target

    if (isRibbonEnabled && !isRibbonPresent) {
        insertRibbon({ annotationsManager, toolbarNotifications, store })
    } else if (!isRibbonEnabled && isRibbonPresent) {
        removeRibbon()
    }
}

/**
 * Updates the ribbon state if it is present.
 * Fetches whether the sidebar and tooltip are enabled.
 * Tells the ribbon to update its state with those values.
 */
const updateRibbon = async (
    args: {
        openRibbon?: boolean
        openToCollections?: boolean
        openToComment?: boolean
        openToTags?: boolean
    } = {},
) => {
    if (!target) {
        return
    }

    // Get ribbon and tooltip state.
    const isRibbonEnabled = await getSidebarState()
    const isTooltipEnabled = await getTooltipState()

    if (ribbonSidebarRef && ribbonSidebarRef.getWrappedInstance()) {
        ribbonSidebarRef.getWrappedInstance().updateRibbonState({
            isRibbonEnabled,
            isTooltipEnabled,
            ...args,
        })
    }
}

/**
 * Setups up RPC functions for the ribbon.
 */
export const setupRPC = ({
    annotationsManager,
    toolbarNotifications,
    store,
}: {
    annotationsManager: AnnotationsManager
    toolbarNotifications: ToolbarNotifications
    store: any
}) => {
    makeRemotelyCallableType<RibbonInteractionsInterface>({
        /**
         * Used for inserting the ribbon.
         */
        insertRibbon: ({ override, ...args } = { override: false }) => {
            manualOverride = !!override
            insertRibbon({
                annotationsManager,
                toolbarNotifications,
                store,
                ...args,
            })
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
            await _insertOrRemoveRibbon({
                annotationsManager,
                toolbarNotifications,
                store,
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
