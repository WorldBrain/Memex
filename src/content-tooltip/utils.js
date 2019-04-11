import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import * as constants from './constants'

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

export const getTooltipState = async () =>
    getLocalStorage(
        constants.TOOLTIP_STORAGE_NAME,
        constants.TOOLTIP_DEFAULT_OPTION,
    )

export const setTooltipState = async tooltipValue =>
    setLocalStorage(constants.TOOLTIP_STORAGE_NAME, tooltipValue)

export const getPositionState = async () =>
    getLocalStorage(
        constants.POSITION_STORAGE_NAME,
        constants.POSITION_DEFAULT_OPTION,
    )

export const setPositionState = async positionValue =>
    setLocalStorage(constants.POSITION_STORAGE_NAME, positionValue)

export const getKeyboardShortcutsState = async () => {
    return getLocalStorage(
        constants.KEYBOARDSHORTCUTS_STORAGE_NAME,
        constants.KEYBOARDSHORTCUTS_DEFAULT_STATE,
    )
}

export const setKeyboardShortcutsState = async newKeyboardShortcutsState => {
    return setLocalStorage(
        constants.KEYBOARDSHORTCUTS_STORAGE_NAME,
        newKeyboardShortcutsState,
    )
}

function isAlpha(str) {
    return /^[a-zA-Z]+$/.test(str)
}

export const convertKeyboardEventToKeyString = e => {
    return (
        (e.altKey ? 'alt+' : '') +
        (e.ctrlKey ? 'ctrl+' : '') +
        (e.metaKey ? 'meta+' : '') +
        (e.shiftKey ? 'shift+' : '') +
        (isAlpha(e.key) ? e.key.toLowerCase() : e.key)
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
