export const isFullUrlPDF = (fullUrl: string): boolean => {
    return fullUrl?.endsWith('.pdf')
}

/**
 * Some URLs, like those of the PDF viewer, hide away the underlying resource's URL.
 * This function will detect special cases and return the underlying resource's URL, if a special case.
 * Should operate like identity function for non-special cases.
 */
export const getUnderlyingResourceUrl = (url: string) => {
    // Naive detection for now
    if (isFullUrlPDF(url) && url.includes('extension://')) {
        return new URL(url).searchParams.get('file')
    }

    return url
}

export const filterTabUrl = (tab) => {
    if (tab) {
        tab.url = getUnderlyingResourceUrl(tab.url)
    }
    return tab
}
