import responseToDataUrl from 'response-to-data-url'

// Get a tab's fav-icon (website logo) as a data URI
async function getFavIcon({tabId}) {
    const tab = await browser.tabs.get(tabId)

    if (tab.favIconUrl === undefined) {
        return undefined
    }

    const response = await fetch(tab.favIconUrl)
    const dataURI = await responseToDataUrl(response)
    return dataURI
}

export default getFavIcon
