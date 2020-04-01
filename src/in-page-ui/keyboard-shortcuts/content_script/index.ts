import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
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
import { KeyboardShortcuts } from '../types'
import { InPageUIInterface } from 'src/in-page-ui/shared-state/types'

type HandleInterface = {
    [key in keyof KeyboardShortcuts]: () => void
}

export async function initKeyboardShortcuts(inPageUI: InPageUIInterface) {
    const { shortcutsEnabled, ...shortcuts } = await getKeyboardShortcutsState()
    if (shortcutsEnabled) {
        const handlers = getShortcutHandlers(inPageUI)
        for (const [shortcutName, shortcutValue] of Object.entries(shortcuts)) {
            if (shortcutValue) {
                Mousetrap.bind(
                    shortcutValue.shortcut,
                    prepareShortcutHandler(handlers[shortcutName]),
                )
            }
        }
    }
}

function prepareShortcutHandler(handler: () => void) {
    return function(event) {
        event.preventDefault()
        event.stopPropagation()
        return handler()
    }
}

function getShortcutHandlers(inPageUI: InPageUIInterface): HandleInterface {
    return {
        addComment: () => inPageUI.showSidebar({ action: 'comment' }),
        addTag: () => inPageUI.showSidebar({ action: 'tag' }),
        addToCollection: () => inPageUI.showSidebar({ action: 'list' }),
        createBookmark: () => inPageUI.showSidebar({ action: 'bookmark' }),
        toggleSidebar: () => inPageUI.toggleSidebar(),
        toggleHighlights: () => inPageUI.toggleHighlights(),
        createHighlight: () => {
            // if (userSelectedText()) {
            //     store.dispatch(createAnnotationAction())
            // }
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
}
