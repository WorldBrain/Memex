import { browser } from 'webextension-polyfill-ts'

import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import * as constants from './constants'
import { KeyboardShortcuts, Shortcut } from './types'

export const delayed = (f, delay) => {
    let timeout = null
    const clear = () => {
        timeout && clearTimeout(timeout)
        timeout = null
    }

    return (...args) => {
        clear()
        timeout = setTimeout(() => {
            f(...args)
            clear()
        }, delay)
    }
}

export const getExtURL = location =>
    browser.runtime ? browser.runtime.getURL(location) : location

export const copyToClipboard = text => {
    const dummy = document.createElement('input')
    document.body.appendChild(dummy)
    dummy.setAttribute('value', text)
    dummy.select()
    document.execCommand('copy')
    document.body.removeChild(dummy)
}

export const getTooltipState: () => Promise<boolean> = async () =>
    getLocalStorage(
        constants.TOOLTIP_STORAGE_NAME,
        constants.TOOLTIP_DEFAULT_OPTION,
    )

export const getHighlightsState: () => Promise<boolean> = async () =>
    getLocalStorage(
        constants.HIGHLIGHTS_STORAGE_NAME,
        constants.HIGHLIGHTS_DEFAULT_OPTION,
    )

export const setHighlightsState = async highlightsValue =>
    setLocalStorage(constants.HIGHLIGHTS_STORAGE_NAME, highlightsValue)

export const setTooltipState = async tooltipValue =>
    setLocalStorage(constants.TOOLTIP_STORAGE_NAME, tooltipValue)

export const getPositionState = async () =>
    getLocalStorage(
        constants.POSITION_STORAGE_NAME,
        constants.POSITION_DEFAULT_OPTION,
    )

export const setPositionState = async positionValue =>
    setLocalStorage(constants.POSITION_STORAGE_NAME, positionValue)

export const getKeyboardShortcutsState = async (): Promise<KeyboardShortcuts> => {
    const storage = await getLocalStorage(
        constants.KEYBOARDSHORTCUTS_STORAGE_NAME,
        constants.KEYBOARDSHORTCUTS_DEFAULT_STATE,
    )

    return shortcutStorageToState(storage)
}

const shortcutStorageToState = (storage): KeyboardShortcuts => {
    const defaults = constants.KEYBOARDSHORTCUTS_DEFAULT_STATE
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
    const defaults = constants.KEYBOARDSHORTCUTS_DEFAULT_STATE
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

export const setKeyboardShortcutsState = async (
    newKeyboardShortcutsState: KeyboardShortcuts,
) => {
    return setLocalStorage(
        constants.KEYBOARDSHORTCUTS_STORAGE_NAME,
        shortcutStateToStorage(newKeyboardShortcutsState),
    )
}

function isAlpha(str) {
    return /^[a-zA-Z]$/.test(str)
}

export const convertKeyboardEventToKeyString = (
    e,
    getKeyVal = event => event.key,
) => {
    if (!isAlpha(e.key)) {
        return ''
    }

    return (
        (e.altKey ? 'alt+' : '') +
        (e.ctrlKey ? 'ctrl+' : '') +
        (e.metaKey ? 'meta+' : '') +
        (e.shiftKey ? 'shift+' : '') +
        getKeyVal(e).toLowerCase()
    )
}

/**
 * Sets up a callback to run on content script shutdown (when a new script starts up).
 * More info: https://stackoverflow.com/questions/25840674/chrome-runtime-sendmessage-throws-exception-from-content-script-after-reloading/25844023#25844023
 */
export function runOnScriptShutdown(callback) {
    const destroyEvent = `destroy-${browser.runtime.id}`
    document.dispatchEvent(new CustomEvent(destroyEvent))

    document.addEventListener(destroyEvent, function() {
        document.removeEventListener(destroyEvent, this)
        callback()
    })
}
