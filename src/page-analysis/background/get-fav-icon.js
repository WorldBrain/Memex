import responseToDataURI from 'src/util/response-to-data-uri'

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
 * @returns {string?} Favicon encoded as data URI.
 */
async function getFavIcon(favIconUrl) {
    if (!favIconUrl) return

    try {
        const response = await fetch(favIconUrl)
        const dataURI = await responseToDataURI(response)
        return dataURI
    } catch (err) {} // carry on without fav-icon
}

/**
 * @param {Document} doc DOM to attempt to extract favicon from.
 * @returns {string?} Favicon encoded as data URI.
 */
const extractFavIcon = doc => getFavIcon(getFavIconURLFromDOM(doc))
export default extractFavIcon
