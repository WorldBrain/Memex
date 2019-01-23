export const PAUSE_STORAGE_KEY = 'is-logging-paused'

export function isLoggable({ url }) {
    // Just remember http(s) pages, ignoring data uris, newtab, ...
    const loggableUrlPattern = /^https?:\/\//
    const urlEndings = ['.svg', '.jpg', '.png', '.jpeg', '.gif']

    // Ignore all pages that are image files
    for (let i = 0; i < urlEndings.length; i++) {
        if (url.endsWith(urlEndings[i])) {
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
