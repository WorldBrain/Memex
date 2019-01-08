import { browser } from 'webextension-polyfill-ts'
function browserIsChrome() {
    // `runtime.getBrowserInfo` is only available on FF web ext API
    return typeof browser.runtime.getBrowserInfo === 'undefined'
}

export default browserIsChrome
