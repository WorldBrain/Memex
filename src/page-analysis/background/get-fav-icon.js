import responseToDataUrl from 'response-to-data-url'

// Get a tab's fav-icon (website logo) as a data URL
async function getFavIcon({ tabId }) {
    const tab = await browser.tabs.get(tabId)

    if (tab.favIconUrl === undefined) {
        return undefined
    }

    return await fetchFavIcon(tab.favIconUrl)
}

export async function fetchFavIcon(url) {
    const response = await fetch(url)

    if (response.status >= 400 && response.status < 600) {
        throw new Error(`Bad fav-icon response from server: ${response.status}`)
    }

    return await responseToDataUrl(response)
}

export default getFavIcon
