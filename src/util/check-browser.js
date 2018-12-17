/**
 * `runtime.getBrowserInfo` is only available on FF web ext API
 * @returns {Boolean} true if current browser is Chrome
 */
function browserIsChrome() {
    return typeof browser.runtime.getBrowserInfo === 'undefined'
}

export default browserIsChrome
