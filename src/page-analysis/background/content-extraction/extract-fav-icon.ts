import responseToDataUrl from 'response-to-data-url'

/**
 * @param url
 * @param {Document} doc DOM to attempt to find favicon URL from.
 * @returns {string?} URL pointing to the document's favicon or null.
 */
function getFavIconURLFromDOM(url, doc) {
    const favEl = doc.querySelector('link[rel*="icon"]')
    const urlPage = new URL(url)
    if (favEl?.href) {
        const urlFavIcon = new URL(favEl.href)
        if (urlFavIcon.protocol.startsWith('chrome-extension')) {
            return favEl.href.replace(urlFavIcon.origin, urlPage.origin)
        } else {
            return favEl.href
        }
    } else {
        return `${urlPage.origin}/favicon.ico`
    }
}

/**
 * @param {string} favIconUrl URL pointing to a favicon.
 * @returns {string?} Favicon encoded as data URL.
 */
async function getFavIcon(favIconUrl) {
    if (!favIconUrl) {
        return
    }

    const response = await fetch(favIconUrl)

    if (response.status >= 400 && response.status < 600) {
        throw new Error(`Bad response from server: ${response.status}`)
    }

    const dataUrl = await responseToDataUrl(response)
    return dataUrl
}

/**
 * @param {Document} doc DOM to attempt to extract favicon from.
 * @returns {string?} Favicon encoded as data URL.
 */
const extractFavIcon = (url, doc = document) => {
    try {
        return getFavIcon(getFavIconURLFromDOM(url, doc))
    } catch (err) {
        return undefined // carry on without fav-icon
    }
}
export default extractFavIcon
