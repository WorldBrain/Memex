import type { Shortcut, BaseKeyboardShortcuts } from './types'
import {
    KEYBOARDSHORTCUTS_DEFAULT_STATE,
    KEYBOARDSHORTCUTS_STORAGE_NAME,
} from './constants'
import { setLocalStorage } from 'src/util/storage'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'

export function shortcutStorageToState(storage): BaseKeyboardShortcuts {
    const defaults = KEYBOARDSHORTCUTS_DEFAULT_STATE
    const keys: (keyof BaseKeyboardShortcuts)[] = [
        'addToCollection',
        'sharePage',
        'addComment',
        'toggleSidebar',
        'toggleHighlights',
        'createAnnotation',
        'createHighlight',
        'createBookmark',
        'openDashboard',
        'shortcutsEnabled',
        'askAI',
        'copyHighlightLink',
    ]

    const shortcuts: Partial<BaseKeyboardShortcuts> = {}

    for (const key of keys) {
        if (key === 'shortcutsEnabled') {
            shortcuts[key] = storage[key] || false
            continue
        }
        const enabledKey = `${key}ShortcutEnabled`
        const shortcutKey = `${key}Shortcut`

        shortcuts[key] = {
            enabled:
                storage[enabledKey] != null
                    ? storage[enabledKey]
                    : defaults[enabledKey],
            shortcut:
                storage[shortcutKey] != null
                    ? storage[shortcutKey]
                    : defaults[shortcutKey],
            altName:
                key === 'createAnnotation'
                    ? 'createSharedAnnotation'
                    : key === 'createHighlight'
                    ? 'createSharedHighlight'
                    : key === 'addToCollection'
                    ? 'createSharedAnnotationAndAddToCollection'
                    : key === 'openDashboard'
                    ? 'openDashboardInNewTab'
                    : undefined,
        }
    }
    return shortcuts as BaseKeyboardShortcuts
}

const shortcutStateToStorage = ({
    shortcutsEnabled,
    ...state
}: BaseKeyboardShortcuts) => {
    const defaults = KEYBOARDSHORTCUTS_DEFAULT_STATE
    const storage = {
        shortcutsEnabled:
            shortcutsEnabled != null
                ? shortcutsEnabled
                : defaults.shortcutsEnabled,
    }

    for (const [key, { enabled, shortcut }] of Object.entries<Shortcut>(
        state as any,
    )) {
        const enabledKey = `${key}ShortcutEnabled`
        const shortcutKey = `${key}Shortcut`

        storage[enabledKey] = enabled != null ? enabled : defaults[enabledKey]
        storage[shortcutKey] =
            shortcut != null ? shortcut : defaults[shortcutKey]
    }

    return storage
}

export async function setKeyboardShortcutsState(
    newKeyboardShortcutsState: BaseKeyboardShortcuts,
) {
    return setLocalStorage(
        KEYBOARDSHORTCUTS_STORAGE_NAME,
        shortcutStateToStorage(newKeyboardShortcutsState),
    )
}

function isAlpha(e: React.KeyboardEvent): boolean {
    return e.keyCode >= 65 && e.keyCode <= 90
}

export const convertKeyboardEventToKeyString = (
    e: React.KeyboardEvent,
    getKeyVal = (event: React.KeyboardEvent) =>
        String.fromCharCode(event.keyCode),
) => {
    if (!isAlpha(e)) {
        return ''
    }

    const altKey = getKeyName({ key: 'alt' })

    return (
        (e.altKey ? altKey + '+' : '') +
        (e.ctrlKey ? 'ctrl+' : '') +
        (e.metaKey ? 'meta+' : '') +
        (e.shiftKey ? 'shift+' : '') +
        getKeyVal(e).toLowerCase()
    )
}
