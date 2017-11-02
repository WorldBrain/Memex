import responseToDataUrl from 'response-to-data-url'

// Get a tab's fav-icon (website logo) as a data URL
async function getFavIcon({ tabId }) {
    const tab = await browser.tabs.get(tabId)

    if (tab.favIconUrl === undefined) {
        return undefined
    }

    const response = await fetch(tab.favIconUrl)

    if (response.status >= 400 && response.status < 600) {
        return Promise.reject(
            new Error(`Bad response from server: ${response.status}`),
        )
    }

    const dataUrl = await responseToDataUrl(response)
    return dataUrl
}

export default getFavIcon
