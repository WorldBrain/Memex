export const isFullUrlPDF = (fullUrl: string): boolean => {
    return fullUrl?.endsWith('.pdf')
}

export const getUrl = (url: string) => {
    // Naive detection for now
    if (isFullUrlPDF(url) && url.includes('extension://')) {
        return new URL(url).searchParams.get('file')
    }

    return url
}

export const filterTabUrl = (tab) => {
    if (tab) {
        tab.url = getUrl(tab.url)
    }
    return tab
}
