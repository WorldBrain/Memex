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
import {
    fetchAnnotationsAndHighlight,
    createAnnotationDraftInSidebar,
    createAnnotationHighlight,
} from 'src/annotations'
import { toggleSidebarOverlay } from 'src/sidebar-overlay/utils'
import { removeHighlights } from 'src/highlighting/ui/highlight-interactions'
import { createAnnotation as createAnnotationAction } from 'src/annotations/actions'
import { extractAnchor } from 'src/highlighting/ui'

export default async function init({
    toolbarNotifications,
    store,
}: {
    toolbarNotifications?: ToolbarNotifications
    store: any
}) {
    runOnScriptShutdown(() => removeTooltip())
    // Set up the RPC calls even if the tooltip is enabled or not.
    setupRPC({ toolbarNotifications, store })
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
            handleKeyboardShortcuts(shortcuts, store),
        )
        return
    }

    await bodyLoader()
    await insertTooltip({ toolbarNotifications, store })
}

let highlightsOn = false

const handleKeyboardShortcuts = (
    {
        addComment,
        addTag,
        addToCollection,
        createAnnotation,
        createHighlight,
        createBookmark,
        link,
        toggleHighlights,
        toggleSidebar,
    }: KeyboardShortcuts,
    store,
) => async e => {
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
            case createAnnotation.shortcut:
                createAnnotation.enabled &&
                    (await createNewAnnotation(e, store))
                break
            case createHighlight.shortcut:
                createHighlight.enabled && (await createNewHighlight(e, store))
                break
            default:
        }
    }
}

const toggleHighlightsAct = () => {
    highlightsOn ? removeHighlights() : fetchAnnotationsAndHighlight()
    highlightsOn = !highlightsOn
}

const createNewAnnotation = async (e, store) => {
    e.preventDefault()
    e.stopPropagation()
    await createAnnotationDraftInSidebar()

    // Remove onboarding select option notification if it's present
    await conditionallyRemoveSelectOption(STAGES.annotation.annotationCreated)
}
// todo (ch - annotations) this does not seem to be called from the keyboard shortcuts, as they are registered from the toolti
const createNewHighlight = async (e, store) => {
    e.preventDefault()
    e.stopPropagation()
    // const url = window.location.href
    // const title = document.title
    const anchor = await extractAnchor(document.getSelection())
    const body = anchor ? anchor.quote : ''
    await store.dispatch(createAnnotationAction(anchor, body, '', []) as any)
    //await createAnnotationHighlight()
}

const createLink = async () => {
    await createAndCopyDirectLink()
}
