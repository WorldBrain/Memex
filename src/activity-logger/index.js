export const PAUSE_STORAGE_KEY = 'is-logging-paused'

export function isLoggable({ url }) {
    // Just remember http(s) pages, ignoring data uris, newtab, ...
    const loggableUrlPattern = /^https?:\/\/\w+([-/.#=$^@&%?+(),]\w*\/?([-/.#=$^@&:%?+(),]\w*\/?)*)*$/
    const urlEndings = ['.svg', '.jpg', '.png', '.jpeg', '.gif']

    // Ignore all pages that are image files
    for (const urlEnding of urlEndings) {
        if (url.endsWith(urlEnding)) {
            return false
        }
    }
    return loggableUrlPattern.test(url)
}

export const getPauseState = async () => {
    const state = (await browser.storage.local.get(PAUSE_STORAGE_KEY))[
        PAUSE_STORAGE_KEY
    ]

    switch (state) {
        case 0:
        case 1:
            return true
        case 2:
        default:
            return false
    }
}
