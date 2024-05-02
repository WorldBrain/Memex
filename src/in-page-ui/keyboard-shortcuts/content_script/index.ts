import Mousetrap from 'mousetrap'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import { userSelectedText } from 'src/in-page-ui/tooltip/content_script/interactions'
import type { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import type { KeyboardShortcuts, Shortcut } from '../types'
import type { AnnotationFunctions } from '@worldbrain/memex-common/lib/in-page-ui/types'
import { RpcError, runInBackground } from 'src/util/webextensionRPC'
import type { InPageUIInterface } from 'src/in-page-ui/background/types'
import { cloneSelectionAsPseudoObject } from '@worldbrain/memex-common/lib/annotations/utils'
import { sleepPromise } from 'src/util/promises'
import { isUrlYTVideo } from '@worldbrain/memex-common/lib/utils/youtube-url'

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
            } else {
                throw err
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
        sharePage: () =>
            inPageUI.showSidebar({
                action: 'cite_page',
            }),
        createSharedAnnotationAndAddToCollection: async () => {
            if (userSelectedText()) {
                await annotationFunctions.createAnnotation(
                    cloneSelectionAsPseudoObject(window.getSelection()),
                    true,
                    true,
                    true,
                    null,
                )
            } else {
                await inPageUI.showRibbon({ action: 'list' })
            }
        },
        createBookmark: () => inPageUI.showRibbon({ action: 'bookmark' }),
        openDashboard: async () =>
            inPageUI.loadOnDemandInPageUI({ component: 'dashboard' }),
        openDashboardInNewTab: () =>
            runInBackground<InPageUIInterface<'caller'>>().openDashboard(),
        toggleSidebar: () => inPageUI.toggleSidebar(),
        askAI: async () => {
            inPageUI.showSidebar({
                action: 'show_page_summary',
                highlightedText: window.getSelection().toString(),
                prompt: null,
                instaExecutePrompt: false,
            })
            inPageUI.hideTooltip()
        },
        createYoutubeTimestamp: async () => {
            await inPageUI.showSidebar({
                action: 'youtube_timestamp',
            })
        },
        instaSummarize: async () => {
            inPageUI.showSidebar({
                action: 'show_page_summary',
                highlightedText: window.getSelection().toString(),
                prompt: null,
                instaExecutePrompt: true,
            })
            inPageUI.hideTooltip()
        },
        toggleHighlights: () => inPageUI.toggleHighlights(),
        createSharedAnnotation: () =>
            annotationFunctions.createAnnotation(
                cloneSelectionAsPseudoObject(window.getSelection()),
                true,
                true,
                false,
                null,
            ),
        createSharedHighlight: async () => {
            annotationFunctions.createHighlight(
                cloneSelectionAsPseudoObject(window.getSelection()),
                true,
            )
            return
        },
        createHighlight: async () => {
            const isYouTube = isUrlYTVideo(window.location.href)

            if (isYouTube) {
                await annotationFunctions.createYoutubeTimestamp()
            } else {
                await annotationFunctions.createHighlight(
                    cloneSelectionAsPseudoObject(window.getSelection()),
                    false,
                )
            }

            inPageUI.hideTooltip()
        },
        createAnnotation: async () => {
            const isToolTipEnabled = inPageUI.componentsShown.tooltip

            if (!isToolTipEnabled) {
                await inPageUI.toggleTooltip()
            }
            if (userSelectedText()) {
                let executed = false
                while (!executed) {
                    try {
                        executed = inPageUI.events.emit('tooltipAction', {
                            annotationCacheId: null,
                            selection: window.getSelection(),
                            openForSpaces: false,
                        })
                    } catch (e) {}
                    if (!isToolTipEnabled) {
                        await sleepPromise(200)
                    }
                }
            }
            return // This ensures the function returns Promise<void>
        },
        addToCollection: async () => {
            const isToolTipEnabled = inPageUI.componentsShown.tooltip
            if (!isToolTipEnabled) {
                await inPageUI.toggleTooltip()
            }
            if (userSelectedText()) {
                let executed = false
                while (!executed) {
                    try {
                        executed = inPageUI.events.emit('tooltipAction', {
                            annotationCacheId: null,
                            selection: window.getSelection(),
                            openForSpaces: true,
                        })
                    } catch (e) {}
                    if (!isToolTipEnabled) {
                        await sleepPromise(200)
                    }
                }
            } else {
                await inPageUI.showRibbon({ action: 'list' })
            }
        },
        copyCurrentLink: async () => {
            if (userSelectedText()) {
                await annotationFunctions.createHighlight(
                    cloneSelectionAsPseudoObject(window.getSelection()),
                    null,
                    true,
                    null,
                    undefined,
                    true,
                )
                // Explicitly return void
                inPageUI.hideTooltip()
                return
            } else {
                inPageUI.hideTooltip()
                return inPageUI.showSidebar({
                    action: 'share_page_link',
                })
            }
        },
    }
}
