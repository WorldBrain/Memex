import * as Mousetrap from 'mousetrap'

import { bodyLoader } from '../util/loader'
import {
    setupRPC,
    insertTooltip,
    userSelectedText,
    removeTooltip,
} from './interactions'
import ToolbarNotifications from '../toolbar-notification/content_script'
import {
    conditionallyShowOnboardingNotifications,
    conditionallyRemoveSelectOption,
} from './onboarding-interactions'
import {
    getTooltipState,
    getKeyboardShortcutsState,
    convertKeyboardEventToKeyString,
    runOnScriptShutdown,
} from './utils'
import { remoteFunction } from 'src/util/webextensionRPC'
import {
    highlightAnnotations,
    removeHighlights,
} from 'src/sidebar-overlay/content_script/highlight-interactions'
import { STAGES } from 'src/overview/onboarding/constants'
import {
    toggleSidebarOverlay,
    createAnnotation,
    createAndCopyDirectLink,
    createHighlight,
} from 'src/direct-linking/content_script/interactions'

export default async function init({
    toolbarNotifications,
}: {
    toolbarNotifications?: ToolbarNotifications
}) {
    runOnScriptShutdown(() => removeTooltip())
    // Set up the RPC calls even if the tooltip is enabled or not.
    setupRPC({ toolbarNotifications })
    await conditionallyShowOnboardingNotifications({
        toolbarNotifications,
    })
    const isTooltipEnabled = await getTooltipState()
    if (!isTooltipEnabled) {
        const shortcutsState = await getKeyboardShortcutsState()
        const {
            shortcutsEnabled,
            highlightShortcut,
            linkShortcut,
            toggleSidebarShortcut,
            toggleHighlightsShortcut,
            createAnnotationShortcut,
            createBookmarkShortcut,
            addTagShortcut,
            addToCollectionShortcut,
            addCommentShortcut,
        } = shortcutsState
        Mousetrap.bind(
            [
                highlightShortcut,
                linkShortcut,
                toggleHighlightsShortcut,
                createAnnotationShortcut,
                toggleSidebarShortcut,
                createBookmarkShortcut,
                addTagShortcut,
                addToCollectionShortcut,
                addCommentShortcut,
            ],
            handleKeyboardShortcuts(shortcutsState),
        )
        return
    }

    await bodyLoader()
    await insertTooltip({ toolbarNotifications })
}

let highlightsOn = false
const handleKeyboardShortcuts = ({
    highlightShortcut,
    linkShortcut,
    toggleSidebarShortcut,
    toggleHighlightsShortcut,
    createAnnotationShortcut,
    highlightShortcutEnabled,
    linkShortcutEnabled,
    toggleSidebarShortcutEnabled,
    toggleHighlightsShortcutEnabled,
    createAnnotationShortcutEnabled,
    createBookmarkShortcut,
    addTagShortcut,
    addToCollectionShortcut,
    addCommentShortcut,
}) => async e => {
    const isTooltipEnabled = await getTooltipState()
    if (!isTooltipEnabled) {
        if (!userSelectedText()) {
            switch (convertKeyboardEventToKeyString(e)) {
                case toggleSidebarShortcut:
                    toggleSidebarShortcutEnabled &&
                        toggleSidebarOverlay({
                            override: true,
                        })
                    break
                case toggleHighlightsShortcut:
                    toggleHighlightsShortcutEnabled && toggleHighlights()
                    break
                case addTagShortcut:
                    toggleSidebarOverlay({ override: true, openToTags: true })
                    break
                case addToCollectionShortcut:
                    toggleSidebarOverlay({
                        override: true,
                        openToCollections: true,
                    })
                    break
                case addCommentShortcut:
                    toggleSidebarOverlay({
                        override: true,
                        openToComment: true,
                    })
                    break
                case createBookmarkShortcut:
                    toggleSidebarOverlay({ override: true })
                    break
                default:
            }
        } else {
            switch (convertKeyboardEventToKeyString(e)) {
                case linkShortcut:
                    linkShortcutEnabled && (await createLink())
                    break
                case highlightShortcut:
                    if (highlightShortcutEnabled) {
                        await createHighlight()
                        toggleHighlights()
                    }
                    break
                case createAnnotationShortcut:
                    createAnnotationShortcutEnabled &&
                        (await createNewAnnotation(e))
                    break
                default:
            }
        }
    }
}

const toggleHighlights = () => {
    highlightsOn ? removeHighlights() : fetchAndHighlightAnnotations()
    highlightsOn = !highlightsOn
}
const fetchAndHighlightAnnotations = async () => {
    const annotations = await remoteFunction('getAllAnnotationsByUrl')(
        window.location.href,
    )
    const highlightables = annotations.filter(annotation => annotation.selector)
    highlightAnnotations(highlightables, toggleSidebarOverlay)
}

const createNewAnnotation = async e => {
    e.preventDefault()
    e.stopPropagation()
    await createAnnotation()

    // Remove onboarding select option notification if it's present
    await conditionallyRemoveSelectOption(STAGES.annotation.annotationCreated)
}

const createLink = async () => {
    await createAndCopyDirectLink()
}
