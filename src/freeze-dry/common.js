import responseToDataUri from 'src/util/response-to-data-uri'

export async function urlToDataUri(url) {
    try {
        const response = await fetch(url, {cache: 'force-cache'})
        const dataUri = await responseToDataUri(response)
        return dataUri
    } catch (err) {
        return 'about:blank'
    }
}

// Find all URLs in the specified attribute(s) of the specified elements, fetch
// their contents, and replace the URL with the content encoded as a data URI.
// The elements argument can be a query selector string if rootElement is given.
export function inlineAttributes({
    elements,
    attributes,
    rootElement,
    docUrl,
}) {
    attributes = Array.isArray(attributes) ? attributes : [attributes]
    if (typeof elements === 'string') {
        elements = rootElement.querySelectorAll(elements)
    }
    const promises = Array.from(elements).map(element => {
        const promises = attributes.map(async attribute => {
            const url = new URL(element.getAttribute(attribute), docUrl)
            const dataUri = await urlToDataUri(url)
            element.setAttribute(attribute, dataUri)
        })
        return Promise.all(promises)
    })
    return Promise.all(promises)
}
