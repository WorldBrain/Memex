import responseToDataUrl from 'response-to-data-url'

// Get a tab's fav-icon (website logo) as a data URL
async function getFavIcon({tabId}) {
    const tab = await browser.tabs.get(tabId)

    if (tab.favIconUrl === undefined) {
        return undefined
    }

    const response = await fetch(tab.favIconUrl)
    const dataUrl = await responseToDataUrl(response)
    return dataUrl
}

export default getFavIcon
