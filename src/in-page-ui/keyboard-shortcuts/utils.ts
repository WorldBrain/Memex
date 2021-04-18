import { KeyboardShortcuts, Shortcut } from './types'
import {
    KEYBOARDSHORTCUTS_DEFAULT_STATE,
    KEYBOARDSHORTCUTS_STORAGE_NAME,
} from './constants'
import { setLocalStorage } from 'src/util/storage'
import { getKeyName } from 'src/util/os-specific-key-names'

export function shortcutStorageToState(storage): KeyboardShortcuts {
    const defaults = KEYBOARDSHORTCUTS_DEFAULT_STATE
    const keys: (keyof KeyboardShortcuts)[] = [
        'addToCollection',
        'addComment',
        'addTag',
        'toggleSidebar',
        'toggleHighlights',
        'createAnnotation',
        'createHighlight',
        'link',
        'createBookmark',
        'openDashboard',
        'shortcutsEnabled',
    ]

    const shortcuts: Partial<KeyboardShortcuts> = {}
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
        }
    }
    return shortcuts as KeyboardShortcuts
}

const shortcutStateToStorage = ({
    shortcutsEnabled,
    ...state
}: KeyboardShortcuts) => {
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
    newKeyboardShortcutsState: KeyboardShortcuts,
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
