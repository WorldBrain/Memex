import favicon from 'favicon'

import responseToDataURI from 'src/util/response-to-data-uri'

// Async wrapper around favicon package
const fetchFaviconUrl = url =>
    new Promise((resolve, reject) =>
        favicon(url, (err, favIconUrl) => err ? reject(err) : resolve(favIconUrl)))

// Get a tab's fav-icon (website logo) as a data URI
async function getFavIcon(favIconUrl) {
    if (favIconUrl === undefined) {
        return undefined
    }

    try {
        const response = await fetch(favIconUrl)
        const dataURI = await responseToDataURI(response)
        return dataURI
    } catch (err) {
        return undefined // carry on without fav-icon
    }
}

export const getFavIconFromTab = async ({ tabId }) => getFavIcon((await browser.tabs.get(tabId)).favIconUrl)
export const getFavIconFromUrl = async ({ url }) => getFavIcon(await fetchFaviconUrl(url))
