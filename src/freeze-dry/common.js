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
export function inlineUrlsInAttributes({
    elements,
    attributes,
    // Default case: the value is a single URL (e.g. for href, src, ...)
    attrToUrls = (value, attribute) => [value],
    fixIntegrity = false,
    rootElement,
    docUrl,
}) {
    attributes = Array.isArray(attributes) ? attributes : [attributes]
    if (typeof elements === 'string') {
        elements = rootElement.querySelectorAll(elements)
    }
    // For each element...
    const promises = Array.from(elements).map(element => {
        // ...for each listed attribute...
        const promises = attributes.map(async attribute => {
            // ...read the URL or URLs to be replaced.
            const value = element.getAttribute(attribute)
            if (!value) return

            // Read the URL or URLs from the attribute value
            const urls = attrToUrls(value, attribute)

            // Fetch (hopefully from cache) the resource for each URL.
            const dataUriPs = urls.map(async url => {
                const absoluteUrl = new URL(url, docUrl)
                const dataUri = await urlToDataUri(absoluteUrl)
                return dataUri
            })
            const dataUris = await Promise.all(dataUriPs)

            // Replace the URLs in the attribute value with the data URIs.
            let newValue = value
            for (let i = 0; i < urls.length; i++) {
                newValue = newValue.replace(urls[i], dataUris[i])
            }
            element.setAttribute(attribute, newValue)
            if (fixIntegrity) {
                // Don't bother recomputing the hash, just remove the check.
                element.removeAttribute('integrity')
            }
        })
        return Promise.all(promises)
    })
    // Return a promise that resolves when finished.
    return Promise.all(promises)
}
