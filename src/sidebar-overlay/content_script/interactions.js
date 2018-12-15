import retargetEvents from 'react-shadow-dom-retarget-events'
import { browser } from 'webextension-polyfill-ts'

import { highlightAnnotation } from 'src/direct-linking/content_script/rendering'
import { makeRemotelyCallable, remoteFunction } from 'src/util/webextensionRPC'
import { setupRibbonUI, destroyAll } from '../components'
import { getSidebarState, getOffsetTop, setSidebarState } from '../utils'
import { setTooltipState, getTooltipState } from '../../content-tooltip/utils'
import styles from 'src/direct-linking/content_script/styles.css'
import { createRootElement, destroyRootElement } from './rendering'
import {
    removeTooltip,
    insertTooltip,
} from '../../content-tooltip/interactions'

const openOptionsRPC = remoteFunction('openOptionsTab')

/**
 * Scrolls to the highlight of the passed annotation.
 * @param {*} annotation The annotation object to scroll to.
 */
export function scrollToHighlight(annotation) {
    const baseClass = styles['memex-highlight']
    const $highlight = document.querySelector(
        `.${baseClass}[data-annotation="${annotation.url}"]`,
    )

    if ($highlight) {
        Element.prototype.documentOffsetTop = function() {
            return (
                this.offsetTop +
                (this.offsetParent ? this.offsetParent.documentOffsetTop() : 0)
            )
        }

        const top = $highlight.documentOffsetTop() - window.innerHeight / 2
        window.scrollTo({ top, behavior: 'smooth' })
        // The pixels scrolled need to be returned in
        // order to restrict scrolling when mouse is
        // over the iFrame
        return top
    } else {
        console.error('MEMEX: Oops, no highlight found to scroll to')
    }
}

/**
 * Given an annotation object, highlights that text and removes other highlights
 * from the page.
 * @param {*} annotation Annotation object which has the selector to be highlighted
 */
export const highlightAndScroll = async annotation => {
    removeHighlights(true)
    makeHighlightDark(annotation)
    return scrollToHighlight(annotation)
}

/**
 * Given an array of annotation objects, highlights all of them.
 * @param {Array<*>} annotations Array of annotations to highlight
 */
export const highlightAnnotations = async (
    annotations,
    focusOnAnnotation,
    hoverAnnotationContainer,
) => {
    annotations.forEach(async annotation =>
        highlightAnnotation(
            { annotation },
            focusOnAnnotation,
            hoverAnnotationContainer,
        ),
    )
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

// Target container for the Ribbon/Sidebar shadow DOM.
let target = null
let shadowRoot = null
let toggleSidebar = null

/* Denotes whether the user inserted/removed ribbon by his/her own self. */
let manualOverride = false

/**
 * Creates target container for Ribbon and Sidebar shadow DOM.
 * Injects content_script.css.
 * Mounts Ribbon React component.
 * Sets up shadow DOM <--> webpage Remote functions.
 */
export const insertRibbon = ({ toolbarNotifications }) => {
    // If target is set, Ribbon has already been injected.
    if (target) {
        return
    }

    let resolveToggleSidebar
    toggleSidebar = new Promise(resolve => {
        resolveToggleSidebar = resolve
    })

    const { shadow, rootElement } = createRootElement({
        containerId: 'memex-annotations-ribbon-container',
        rootId: 'memex-annotations-ribbon',
        classNames: ['memex-annotations-ribbon'],
    })
    target = rootElement
    shadowRoot = shadow

    // React messes up event propagation with shadow dom, hence fix.
    retargetEvents(shadowRoot)

    setupRibbonUI(target, {
        onInit: ({ toggleSidebar }) => {
            resolveToggleSidebar(toggleSidebar)
        },
        onClose: async () => {
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
        getInitialState: async () => {
            const isTooltipEnabled = await getTooltipState()
            const isRibbonEnabled = await getSidebarState()
            return { isTooltipEnabled, isRibbonEnabled }
        },
        handleRibbonToggle: async prevState => {
            await setSidebarState(!prevState)
        },
        handleTooltipToggle: async isTooltipEnabled => {
            if (isTooltipEnabled) {
                removeTooltip()
            } else {
                await insertTooltip({ toolbarNotifications })
            }
            await setTooltipState(!isTooltipEnabled)
        },
    })
}

const removeRibbon = () => {
    if (!target) {
        return
    }
    removeHighlights()
    destroyAll(target, shadowRoot)()
    destroyRootElement()
    shadowRoot = null
    target = null
    toggleSidebar = null
}

/**
 * Inserts or removes ribbon from the page (if not overridden manually).
 * Should either be called through the RPC, or pass the `toolbarNotifications`
 * wrapped in an object.
 */
const insertOrRemoveRibbon = async ({ toolbarNotifications }) => {
    if (manualOverride) {
        return
    }

    const isRibbonEnabled = await getSidebarState()
    const isRibbonPresent = !!target

    if (isRibbonEnabled && !isRibbonPresent) {
        insertRibbon({ toolbarNotifications })
    } else if (!isRibbonEnabled && isRibbonPresent) {
        removeRibbon()
    }
}

/**
 * Setups up RPC functions to insert and remove Ribbon from Popup.
 */
export const setupRPC = ({ toolbarNotifications }) => {
    makeRemotelyCallable({
        toggleSidebarOverlay: async () => {
            if (!toggleSidebar) {
                manualOverride = true
                insertRibbon({ toolbarNotifications })
            }
            return toggleSidebar.then(f => f())
        },
        insertRibbon: ({ override } = {}) => {
            manualOverride = !!override
            insertRibbon({ toolbarNotifications })
        },
        removeRibbon: ({ override } = {}) => {
            manualOverride = !!override
            removeRibbon()
        },
        insertOrRemoveRibbon: async () => {
            await insertOrRemoveRibbon({ toolbarNotifications })
        },
    })
}

/**
 * Attaches event listeners to the highlightsfor hovering/focusing
 * on the annotaiton in sidebar.
 * @param {*} annotation The annotation to which the listeners are going to be attached
 * @param {function} focusOnAnnotation Function when called will set the sidebar container to active state
 * @param {function} hoverAnnotationContainer Function when called will set the sidebar container to hover state
 */
export const attachEventListenersToNewHighlights = (
    annotation,
    focusOnAnnotation,
    hoverAnnotationContainer,
) => {
    const newHighlights = document.querySelectorAll(
        `.${styles['memex-highlight']}:not([data-annotation])`,
    )
    newHighlights.forEach(highlight => {
        highlight.dataset.annotation = annotation.url
        if (!focusOnAnnotation || !hoverAnnotationContainer) {
            return
        }

        const clickListener = async e => {
            e.preventDefault()
            if (!e.target.dataset.annotation) {
                return
            }
            removeHighlights(true)
            makeHighlightDark(annotation)
            focusOnAnnotation(annotation.url)
        }
        highlight.addEventListener('click', clickListener, false)

        const mouseenterListener = e => {
            if (!e.target.dataset.annotation) {
                return
            }
            removeMediumHighlights()
            makeHighlightMedium(annotation)
            hoverAnnotationContainer(annotation.url)
        }
        highlight.addEventListener('mouseenter', mouseenterListener, false)

        const mouseleaveListener = e => {
            if (!e.target.dataset.annotation) {
                return
            }
            removeMediumHighlights()
            hoverAnnotationContainer('')
        }
        highlight.addEventListener('mouseleave', mouseleaveListener, false)
    })
}

/**
 * Removes the medium class from all the highlights making them light.
 */
export const removeMediumHighlights = () => {
    // Remove previous "medium" highlights
    const baseClass = styles['memex-highlight']
    const mediumClass = styles['medium']
    const prevHighlights = document.querySelectorAll(
        `.${baseClass}.${mediumClass}`,
    )
    prevHighlights.forEach(highlight => highlight.classList.remove(mediumClass))
}

/**
 * Makes the given annotation as a medium highlight.
 * @param {string} url PK of the annotation to make medium
 */
export const makeHighlightMedium = ({ url }) => {
    // Make the current annotation as a "medium" highlight
    const baseClass = styles['memex-highlight']
    const mediumClass = styles['medium']
    const highlights = document.querySelectorAll(
        `.${baseClass}[data-annotation="${url}"]`,
    )
    highlights.forEach(highlight => highlight.classList.add(mediumClass))
}

/**
 * Makes the highlight a dark highlight
 * @param {string} url PK of the annotation to make dark
 */

export const makeHighlightDark = ({ url }) => {
    const baseClass = styles['memex-highlight']
    const highlights = document.querySelectorAll(
        `.${baseClass}[data-annotation="${url}"]`,
    )

    highlights.forEach(highlight => {
        highlight.classList.add(styles['dark'])
    })
}

/**
 * Removes all highlight elements in the current page.
 * @param {bool} isDark If isDark is true, only dark highlights will be removed.
 */
export function removeHighlights(isDark) {
    const baseClass = '.' + styles['memex-highlight']
    const darkClass = isDark ? '.' + styles['dark'] : ''
    const highlightClass = `${baseClass}${darkClass}`
    const highlights = document.querySelectorAll(highlightClass)

    highlights.forEach(highlight => {
        highlight.classList.remove(styles['dark'])
        if (!isDark) {
            removeHighlight(highlight)
        }
    })
}

/**
 * Unwraps the span element from the highlight,
 * resetting the DOM Text to how it was.
 */
const removeHighlight = highlight => {
    const parent = highlight.parentNode
    while (highlight.firstChild) {
        parent.insertBefore(highlight.firstChild, highlight)
    }
    parent.removeChild(highlight)
}

/**
 * Removes all the highlights of a given annotation.
 * Called when the annotation is deleted.
 * @param {string} url PK of the annotation to be removed
 */
export const removeAnnotationHighlights = ({ url }) => {
    const baseClass = styles['memex-highlight']
    const highlights = document.querySelectorAll(
        `.${baseClass}[data-annotation="${url}"]`,
    )
    highlights.forEach(highlight => removeHighlight(highlight))
}

/**
 * Sends a message to the background to open up Memex Settings.
 */
export const openSettings = () => openOptionsRPC('settings')

/**
 * Finds each annotations position in page, sorts it by the position and returns.
 * @param {Array<*>} annotations Array of Annotation objects
 * @returns {Array<*>} Sorted array of Annotations
 */
export const sortAnnotationByPosition = annotations => {
    const annotationsWithTops = annotations.map(annotation => {
        const firstHighlight = document.querySelector(
            `.${styles['memex-highlight']}[data-annotation="${
                annotation.url
            }"]`,
        )
        return {
            ...annotation,
            offsetTop: firstHighlight ? getOffsetTop(firstHighlight) : Infinity,
        }
    })
    return annotationsWithTops.sort((a, b) => a.offsetTop > b.offsetTop)
}
