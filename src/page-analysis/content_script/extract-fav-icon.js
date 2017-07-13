import responseToDataUrl from 'response-to-data-url'

/**
 * @param {Document} doc DOM to attempt to find favicon URL from.
 * @returns {string?} URL pointing to the document's favicon or null.
 */
function getFavIconURLFromDOM(doc) {
    const favEl = doc.querySelector('link[rel*="icon"]')
    return favEl && favEl.href
}

/**
 * @param {string} favIconUrl URL pointing to a favicon.
 * @returns {string?} Favicon encoded as data URL.
 */
async function getFavIcon(favIconUrl) {
    if (!favIconUrl) return

    try {
        const response = await fetch(favIconUrl)
        const dataUrl = await responseToDataUrl(response)
        return dataUrl
    } catch (err) {} // carry on without fav-icon
}

/**
 * @param {Document} doc DOM to attempt to extract favicon from.
 * @returns {string?} Favicon encoded as data URL.
 */
const extractFavIcon = (doc = document) => getFavIcon(getFavIconURLFromDOM(doc))
export default extractFavIcon
