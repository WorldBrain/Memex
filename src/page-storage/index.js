import docuri from 'docuri'
import encodeUrl from 'src/util/encode-url-for-id'

export const pageKeyPrefix = 'page/'

export const convertPageDocId = docuri.route(`${pageKeyPrefix}:url`)

export const pageDocsSelector = {
    _id: { $gte: pageKeyPrefix, $lte: `${pageKeyPrefix}\uffff` },
}

/**
 * Generates a page doc ID for use in the WorldBrain data model. Our page doc IDs are based
 * on the URL of the web page that they represent. The URL should be encoded into base64.
 *
 * @param {string} url The URL to generate the ID from.
 * @returns {string} The PouchDB ID ready for use with a new page doc.
 * @throws {URIError} Thrown if the `url` is malformed.
 */
export const generatePageDocId = ({ url }) =>
    convertPageDocId({ url: encodeUrl(url, false) })
