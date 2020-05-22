import Mousetrap from 'mousetrap'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import {
    userSelectedText,
    createHighlightFromTooltip,
} from 'src/in-page-ui/tooltip/content_script/interactions'
import { createHighlight } from 'src/highlighting/ui'
import { conditionallyRemoveOnboardingSelectOption } from 'src/in-page-ui/tooltip/onboarding-interactions'
import { STAGES } from 'src/overview/onboarding/constants'
import { createAndCopyDirectLink } from 'src/direct-linking/content_script/interactions'
import { InPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { KeyboardShortcuts } from '../types'
import AnnotationsManager from 'src/annotations/annotations-manager'

type HandleInterface = {
    [key in keyof KeyboardShortcuts]: () => void
}

export interface KeyboardShortcutsDependencies {
    inPageUI: InPageUIInterface
    annotationsManager: AnnotationsManager
    pageUrl: string
    pageTitle: string
}

export async function initKeyboardShortcuts(
    dependencies: KeyboardShortcutsDependencies,
) {
    const { shortcutsEnabled, ...shortcuts } = await getKeyboardShortcutsState()
    if (shortcutsEnabled) {
        const handlers = getShortcutHandlers(dependencies)
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
    return function (event) {
        event.preventDefault()
        event.stopPropagation()
        return handler()
    }
}

function getShortcutHandlers({
    inPageUI,
    annotationsManager,
    pageTitle: title,
    pageUrl: url,
}: KeyboardShortcutsDependencies): HandleInterface {
    return {
        addComment: () => inPageUI.showRibbon({ action: 'comment' }),
        addTag: () => inPageUI.showRibbon({ action: 'tag' }),
        addToCollection: () => inPageUI.showRibbon({ action: 'list' }),
        createBookmark: () => inPageUI.showRibbon({ action: 'bookmark' }),
        toggleSidebar: () => {
            inPageUI.toggleSidebar()
        },
        toggleHighlights: () => inPageUI.toggleHighlights(),
        createHighlight: () =>
            createHighlightFromTooltip({
                annotationsManager,
                title,
                url,
                openSidebar: ({ activeUrl: annotationUrl }) =>
                    inPageUI.showSidebar({
                        action: 'show_annotation',
                        annotationUrl,
                    }),
            }),
        createAnnotation: async () => {
            if (userSelectedText()) {
                const highlight = await createHighlight(undefined, true)
                await inPageUI.showSidebar({
                    action: 'comment',
                    anchor: highlight.selector,
                })
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
