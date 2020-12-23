import { KeyboardShortcuts, Shortcut } from './types'
import {
    KEYBOARDSHORTCUTS_DEFAULT_STATE,
    KEYBOARDSHORTCUTS_STORAGE_NAME,
} from './constants'
import { setLocalStorage } from 'src/util/storage'

export function shortcutStorageToState(storage): KeyboardShortcuts {
    const defaults = KEYBOARDSHORTCUTS_DEFAULT_STATE
    const keys = [
        'addToCollection',
        'addComment',
        'addTag',
        'toggleSidebar',
        'toggleHighlights',
        'createAnnotation',
        'createHighlight',
        'link',
        'createBookmark',
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

function checkOperatingSystem() {
    let OperatingSystem = navigator.platform

    if (OperatingSystem.startsWith('Mac')) {
        return 'Mac'
    }
    if (OperatingSystem.startsWith('Win')) {
        return 'Win'
    }
    if (OperatingSystem.startsWith('Linux')) {
        return 'alt'
    }
}

export const convertKeyboardEventToKeyString = (
    e: React.KeyboardEvent,
    getKeyVal = (event: React.KeyboardEvent) =>
        String.fromCharCode(event.keyCode),
) => {
    if (!isAlpha(e)) {
        return ''
    }

    if (checkOperatingSystem() === 'Mac') {
        return (
            (e.altKey ? 'option+' : '') +
            (e.ctrlKey ? 'ctrl+' : '') +
            (e.metaKey ? 'meta+' : '') +
            (e.shiftKey ? 'shift+' : '') +
            getKeyVal(e).toLowerCase()
        )
    }

    if (checkOperatingSystem() === 'Win') {
        return (
            (e.altKey ? 'alt+' : '') +
            (e.ctrlKey ? 'ctrl+' : '') +
            (e.metaKey ? 'meta+' : '') +
            (e.shiftKey ? 'shift+' : '') +
            getKeyVal(e).toLowerCase()
        )
    }
}
