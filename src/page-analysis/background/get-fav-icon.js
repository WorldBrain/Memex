import responseToDataURI from 'src/util/response-to-data-uri'

// Get a tab's fav-icon (website logo) as a data URI
function getFavIcon({tabId}) {
    return browser.tabs.get(tabId).then(tab => {
        if (tab.favIconUrl === undefined)
            return undefined
        return fetch(tab.favIconUrl).then(responseToDataURI).catch(
            err => undefined // carry on without fav-icon
        )
    })
}

export default getFavIcon
