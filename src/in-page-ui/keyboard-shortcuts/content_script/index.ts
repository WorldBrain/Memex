import Mousetrap from 'mousetrap'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import { userSelectedText } from 'src/in-page-ui/tooltip/content_script/interactions'
import { createAnnotationDraftInSidebar } from 'src/annotations'
import { conditionallyRemoveOnboardingSelectOption } from 'src/in-page-ui/tooltip/onboarding-interactions'
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
        addComment: () => inPageUI.showRibbon({ action: 'comment' }),
        addTag: () => inPageUI.showRibbon({ action: 'tag' }),
        addToCollection: () => inPageUI.showRibbon({ action: 'list' }),
        createBookmark: () => inPageUI.showRibbon({ action: 'bookmark' }),
        toggleSidebar: () => inPageUI.toggleSidebar(),
        toggleHighlights: () => inPageUI.toggleHighlights(),
        createHighlight: () => {
            inPageUI.showSidebar({ action: 'annotate' })
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
