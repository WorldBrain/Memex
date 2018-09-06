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
    browser.extension ? browser.extension.getURL(location) : location

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
