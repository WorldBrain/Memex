import responseToDataURI from 'src/util/response-to-data-uri'

// Get a tab's fav-icon (website logo) as a data URI
async function getFavIcon({tabId}) {
    const tab = await browser.tabs.get(tabId)

    if (tab.favIconUrl === undefined) {
        return undefined
    }

    const response = await fetch(tab.favIconUrl)
    const dataURI = await responseToDataURI(response)
    return dataURI
}

export default getFavIcon
