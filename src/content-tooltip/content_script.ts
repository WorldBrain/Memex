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
import { STAGES } from 'src/overview/onboarding/constants'
import { createAndCopyDirectLink } from 'src/direct-linking/content_script/interactions'
import { KeyboardShortcuts } from './types'
import { createHighlight } from 'src/highlighting/ui'
import {
    fetchAnnotationsAndHighlight,
    createAnnotationDraftInSidebar as createAnnotationAct,
} from 'src/annotations'
import { toggleSidebarOverlay } from 'src/sidebar-overlay/utils'
import { removeHighlights } from 'src/highlighting/ui/highlight-interactions'

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
        const {
            shortcutsEnabled,
            ...shortcuts
        } = await getKeyboardShortcutsState()

        Mousetrap.bind(
            Object.values(shortcuts).map(val => val.shortcut),
            handleKeyboardShortcuts(shortcuts),
        )
        return
    }

    await bodyLoader()
    await insertTooltip({ toolbarNotifications })
}

let highlightsOn = false
const handleKeyboardShortcuts = ({
    addComment,
    addTag,
    addToCollection,
    createAnnotation,
    createBookmark,
    highlight,
    link,
    toggleHighlights,
    toggleSidebar,
}: KeyboardShortcuts) => async e => {
    if (!userSelectedText()) {
        switch (convertKeyboardEventToKeyString(e)) {
            case toggleSidebar.shortcut:
                toggleSidebar.enabled &&
                    toggleSidebarOverlay({
                        override: true,
                        openSidebar: true,
                    })
                break
            case toggleHighlights.shortcut:
                toggleHighlights.enabled && toggleHighlightsAct()
                break
            case addTag.shortcut:
                addTag.enabled &&
                    toggleSidebarOverlay({
                        override: true,
                        openToTags: true,
                    })
                break
            case addToCollection.shortcut:
                addToCollection.enabled &&
                    toggleSidebarOverlay({
                        override: true,
                        openToCollections: true,
                    })
                break
            case addComment.shortcut:
                addComment.enabled &&
                    toggleSidebarOverlay({
                        override: true,
                        openToComment: true,
                    })
                break
            case createBookmark.shortcut:
                createBookmark.enabled &&
                    toggleSidebarOverlay({
                        override: true,
                        openToBookmark: true,
                    })
                break
            default:
        }
    } else {
        switch (convertKeyboardEventToKeyString(e)) {
            case link.shortcut:
                link.enabled && (await createLink())
                break
            case highlight.shortcut:
                if (highlight.enabled) {
                    await createHighlight()
                    toggleHighlightsAct()
                }
                break
            case createAnnotation.shortcut:
                createAnnotation.enabled && (await createNewAnnotation(e))
                break
            default:
        }
    }
}

const toggleHighlightsAct = () => {
    highlightsOn ? removeHighlights() : fetchAnnotationsAndHighlight()
    highlightsOn = !highlightsOn
}

const createNewAnnotation = async e => {
    e.preventDefault()
    e.stopPropagation()
    await createAnnotationAct()

    // Remove onboarding select option notification if it's present
    await conditionallyRemoveSelectOption(STAGES.annotation.annotationCreated)
}

const createLink = async () => {
    await createAndCopyDirectLink()
}
