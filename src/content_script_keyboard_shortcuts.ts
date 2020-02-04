import { getKeyboardShortcutsState } from 'src/content-tooltip/utils'
import { KeyboardShortcuts } from 'src/content-tooltip/types'
import { userSelectedText } from 'src/content-tooltip/interactions'
import { removeHighlights } from 'src/highlighting/ui/highlight-interactions'
import {
    createAnnotationDraftInSidebar,
    fetchAnnotationsAndHighlight,
} from 'src/annotations'
import { conditionallyRemoveOnboardingSelectOption } from 'src/content-tooltip/onboarding-interactions'
import { STAGES } from 'src/overview/onboarding/constants'
import { createAnnotation as createAnnotationAction } from 'src/annotations/actions'
import * as Mousetrap from 'mousetrap'
import { createAndCopyDirectLink } from 'src/direct-linking/content_script/interactions'
import { remoteFunction } from 'src/util/webextensionRPC'

/*
// N.B. The following should work and allow for a cleaner binding of function calls, but doesn't.
// Why does the following not work? it always fires the last bound callback, is there something wrong with the execution context or the Mousetrap bind?
export const initKeyboardShortcuts = async ({ store }) => {
    const {
        shortcutsEnabled,
        ...shortcuts
    } = await getKeyboardShortcutsState()

    if (shortcutsEnabled) {
        for (const shortcutIndex of Object.keys(shortcuts)) {
            const shortcutValue = shortcuts[shortcutIndex]

            console.log(`binding ${shortcutIndex} to ${shortcutValue.shortcut}`)
            const keyhandler = (event) => {
                event.preventDefault()
                event.stopPropagation()
                console.log(`Keyboard shortcutHandler for ${shortcutIndex} firing...`)
                return shortcutHandlers[shortcutIndex]({ store, event })
            }
            if (shortcutValue.enabled) {
                Mousetrap.bind(
                    shortcutValue.shortcut,
                    keyhandler,
                )
            }
        }
    }
}
*/
// TODO: for now we'll do this, mapping keys to indexes and indexes to callbacks
//////
const shortcutMap = {}
export const initKeyboardShortcuts = async ({ store }) => {
    const { shortcutsEnabled, ...shortcuts } = await getKeyboardShortcutsState()

    if (shortcutsEnabled) {
        for (const shortcutIndex of Object.keys(shortcuts)) {
            const shortcutValue = shortcuts[shortcutIndex]
            if (shortcutValue.enabled) {
                shortcutMap[shortcutValue.shortcut] = shortcutIndex
            }
        }
        Mousetrap.bind(Object.keys(shortcutMap), shortcutHandler(store))
    }
}
const shortcutHandler = store => e => {
    const shortcutFunction = shortcutHandlers[shortcutMap[e.key]]

    if (shortcutFunction) {
        e.stopPropagation()
        e.preventDefault()
        return shortcutFunction({ store })
    } else {
        console.error(`${shortcutMap[e.key]} does not map to a functions`)
    }
}
/////////

type HandleInterface = {
    [key in keyof KeyboardShortcuts]: ({ store, event }) => void
}

let highlightsOn = false

// FIXME (ch - annotations): replace toggleSidebarOverlay with typed RPC version
// FIXME (ch - annotations): Fix store so we don't have to dispatch with as any
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
        highlightsOn ? removeHighlights() : fetchAnnotationsAndHighlight()
        highlightsOn = !highlightsOn
    },

    createHighlight: ({ store }) => {
        if (userSelectedText()) {
            store.dispatch(createAnnotationAction() as any)
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
