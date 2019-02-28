import { browser } from 'webextension-polyfill-ts'

import { RetryTimeoutError } from 'src/direct-linking/utils'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import * as constants from './constants'

/**
 * Keeps executing a promiseCreator function till no error is thrown.
 */
export function retryUntilErrorResolves(
    promiseCreator,
    {
        intervalMilliSeconds,
        timeoutMilliSeconds,
    }: { intervalMilliSeconds: number; timeoutMilliSeconds: number },
) {
    const startMs = Date.now()
    return new Promise((resolve, reject) => {
        const doTry = async () => {
            let res
            try {
                res = await promiseCreator()
                resolve(res)
                return true
            } catch (e) {
                return false
            }
        }

        const tryOrRetryLater = async () => {
            if (await doTry()) {
                resolve(true)
                return
            }

            if (Date.now() - startMs >= timeoutMilliSeconds) {
                return reject(new RetryTimeoutError())
            }

            setTimeout(tryOrRetryLater, intervalMilliSeconds)
        }

        tryOrRetryLater()
    })
}

/**
 * Calculates the number of pixels from the starting of the webpage.
 * @param {HTMLElement} element DOM element to calculate the offsetTop.
 * @returns The number of pixels from the starting of the webpage.
 */
export const getOffsetTop = (element: HTMLElement) => {
    let el = element
    let offset = 0
    while (el) {
        offset = offset + el.offsetTop
        el = el.offsetParent as HTMLElement
    }
    return offset
}

export const getSidebarState = async () =>
    getLocalStorage(
        constants.SIDEBAR_STORAGE_NAME,
        constants.SIDEBAR_DEFAULT_OPTION,
    )

export const setSidebarState = async (enabled: boolean) =>
    setLocalStorage(constants.SIDEBAR_STORAGE_NAME, enabled)

export const getExtUrl = (location: string) =>
    browser.runtime ? browser.runtime.getURL(location) : location
