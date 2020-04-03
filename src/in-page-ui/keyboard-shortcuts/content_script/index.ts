import Mousetrap from 'mousetrap'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import { userSelectedText } from 'src/content-tooltip/interactions'
import { createAnnotationDraftInSidebar } from 'src/annotations'
import { conditionallyRemoveOnboardingSelectOption } from 'src/content-tooltip/onboarding-interactions'
import { STAGES } from 'src/overview/onboarding/constants'
import { createAndCopyDirectLink } from 'src/direct-linking/content_script/interactions'
import { InPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { KeyboardShortcuts } from '../types'

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
