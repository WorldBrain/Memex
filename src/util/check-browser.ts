import browser from 'webextension-polyfill'

export type BrowserName = 'chrome' | 'firefox' | 'brave'

/**
 * NOTE: Does not work from the content-script.
 */
function checkBrowser(): BrowserName {
    // `runtime.getBrowserInfo` is only available on FF web ext API
    if (typeof browser.runtime.getBrowserInfo !== 'undefined') {
        return 'firefox'
    }

    if (typeof navigator['brave']?.isBrave === 'function') {
        return 'brave'
    }

    return 'chrome'
}

export default checkBrowser
