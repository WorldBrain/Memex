export const isFullUrlPDF = (fullUrl: string) => {
    return fullUrl.endsWith('.pdf')
}

export const getUrl = (url: string) => {
    // Naive detection for now
    if (url.endsWith('.pdf') && url.includes('extension://')) {
        return new URL(url).searchParams.get('file')
    }

    return url
}
