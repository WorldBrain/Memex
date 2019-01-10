import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { ANNOTATION_DEMO_URL } from 'src/overview/onboarding/constants'
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

// Finding the coordinates to center the notification box
export const getPageCenter = () => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2 - 200, // Assuming average height as 200, since height is 'auto'
})

/**
 * Check whether page is onboarding demo page (Wikipedia Memex)
 */
export const isDemoPage = () => window.location.href === ANNOTATION_DEMO_URL
