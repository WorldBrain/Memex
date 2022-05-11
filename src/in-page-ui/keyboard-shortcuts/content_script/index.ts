import Mousetrap from 'mousetrap'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import { userSelectedText } from 'src/in-page-ui/tooltip/content_script/interactions'
import { createAndCopyDirectLink } from 'src/annotations/content_script/interactions'
import type { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import type { KeyboardShortcuts, Shortcut } from '../types'
import type { AnnotationFunctions } from 'src/in-page-ui/tooltip/types'
import { RpcError, runInBackground } from 'src/util/webextensionRPC'
import type { InPageUIInterface } from 'src/in-page-ui/background/types'

type HandleInterface = {
    [key in keyof KeyboardShortcuts]: () => Promise<void>
}

export interface KeyboardShortcutsDependencies extends AnnotationFunctions {
    inPageUI: SharedInPageUIInterface
}

export async function initKeyboardShortcuts(
    dependencies: KeyboardShortcutsDependencies,
) {
    const { shortcutsEnabled, ...shortcuts } = await getKeyboardShortcutsState()
    if (shortcutsEnabled) {
        const handlers = getShortcutHandlers(dependencies)
        const entries: Array<[string, Shortcut]> = Object.entries(shortcuts)
        for (const [shortcutName, shortcutValue] of entries) {
            if (shortcutValue.enabled) {
                Mousetrap.bind(
                    shortcutValue.shortcut,
                    prepareShortcutHandler(handlers[shortcutName]),
                )
            }

            // Some shortcuts have an alternative handler that gets called when "Shift" held
            if (
                shortcutValue.altName != null &&
                !shortcutValue.shortcut.includes('shift')
            ) {
                const altHandler = handlers[shortcutValue.altName]
                if (altHandler != null) {
                    Mousetrap.bind(
                        'shift+' + shortcutValue.shortcut,
                        prepareShortcutHandler(altHandler),
                    )
                }
            }
        }
    }
}

export const resetKeyboardShortcuts = () => Mousetrap.reset()

function prepareShortcutHandler(handler: () => Promise<void>) {
    return function (event) {
        event.preventDefault()
        event.stopPropagation()
        return handler().catch((err) => {
            if (err instanceof RpcError) {
                resetKeyboardShortcuts()
            }
        })
    }
}

function getShortcutHandlers({
    inPageUI,
    ...annotationFunctions
}: KeyboardShortcutsDependencies): HandleInterface {
    return {
        addComment: () => inPageUI.showRibbon({ action: 'comment' }),
        addTag: () => inPageUI.showRibbon({ action: 'tag' }),
        addToCollection: async () => {
            if (userSelectedText()) {
                await annotationFunctions.createAnnotation(false, true)
            } else {
                await inPageUI.showRibbon({ action: 'list' })
            }
        },
        createSharedAnnotationAndAddToCollection: async () => {
            if (userSelectedText()) {
                await annotationFunctions.createAnnotation(true, true)
            } else {
                await inPageUI.showRibbon({ action: 'list' })
            }
        },
        createBookmark: () => inPageUI.showRibbon({ action: 'bookmark' }),
        openDashboard: () =>
            runInBackground<InPageUIInterface<'caller'>>().openDashboard(),
        toggleSidebar: () => inPageUI.toggleSidebar(),
        toggleHighlights: () => inPageUI.toggleHighlights(),
        createSharedAnnotation: () =>
            annotationFunctions.createAnnotation(true),
        createSharedHighlight: () => annotationFunctions.createHighlight(true),
        createHighlight: () => annotationFunctions.createHighlight(false),
        createAnnotation: () => annotationFunctions.createAnnotation(false),
        link: async () => {
            if (userSelectedText()) {
                await createAndCopyDirectLink()
            }
        },
    }
}
