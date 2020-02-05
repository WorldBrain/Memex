import { getKeyboardShortcutsState } from 'src/content-tooltip/utils'
import { KeyboardShortcuts } from 'src/content-tooltip/types'
import { userSelectedText } from 'src/content-tooltip/interactions'
import { removeHighlights } from 'src/highlighting/ui/highlight-interactions'
import {
    createAnnotationDraftInSidebar,
    highlightAnnotations,
} from 'src/annotations'
import { conditionallyRemoveOnboardingSelectOption } from 'src/content-tooltip/onboarding-interactions'
import { STAGES } from 'src/overview/onboarding/constants'
import { createAnnotation as createAnnotationAction } from 'src/annotations/actions'
import { createAndCopyDirectLink } from 'src/direct-linking/content_script/interactions'
import { remoteFunction } from 'src/util/webextensionRPC'
import Mousetrap from 'mousetrap'

type HandleInterface = {
    [key in keyof KeyboardShortcuts]: ({
        store,
        event,
    }: {
        store: any
        event: any
    }) => void
}

export const initKeyboardShortcuts = async ({ store }) => {
    const { shortcutsEnabled, ...shortcuts } = await getKeyboardShortcutsState()
    if (shortcutsEnabled) {
        for (const [shortcutName, shortcutValue] of Object.entries(shortcuts)) {
            if (shortcutValue) {
                Mousetrap.bind(
                    shortcutValue.shortcut,
                    handleShortcut(shortcutName, { store }),
                )
            }
        }
    }
}

function handleShortcut(shortcutIndex, opts) {
    // N.B. this function needs to be created here to work with the execution scope above
    return function(event) {
        event.preventDefault()
        event.stopPropagation()
        return shortcutHandlers[shortcutIndex](opts)
    }
}

let highlightsOn = false

// FIXME (ch - annotations): replace toggleSidebarOverlay with typed RPC version
const shortcutHandlers: HandleInterface = {
    addComment: () =>
        remoteFunction('toggleSidebarOverlay')({
            override: true,
            openToComment: true,
        }),

    addTag: () =>
        remoteFunction('toggleSidebarOverlay')({
            override: true,
            openToTags: true,
        }),

    addToCollection: () =>
        remoteFunction('toggleSidebarOverlay')({
            override: true,
            openToCollections: true,
        }),

    createBookmark: () =>
        remoteFunction('toggleSidebarOverlay')({
            override: true,
            openToBookmark: true,
        }),

    toggleSidebar: () =>
        remoteFunction('toggleSidebarOverlay')({
            override: true,
            openSidebar: true,
        }),

    toggleHighlights: () => {
        highlightsOn ? removeHighlights() : highlightAnnotations()
        highlightsOn = !highlightsOn
    },

    createHighlight: ({ store }) => {
        if (userSelectedText()) {
            store.dispatch(createAnnotationAction())
        }
    },

    createAnnotation: async () => {
        if (userSelectedText()) {
            await createAnnotationDraftInSidebar()
            await conditionallyRemoveOnboardingSelectOption(
                STAGES.annotation.annotationCreated,
            )
        }
    },

    link: async () => {
        if (userSelectedText()) {
            await createAndCopyDirectLink()
        }
    },
}
