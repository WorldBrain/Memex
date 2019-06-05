import responseToDataUrl from 'response-to-data-url'

async function fetchImage(url: string): Promise<string> {
    if (url === null) {
        return
    }

    const response = await fetch(url)

    if (response.status >= 400 && response.status < 600) {
        console.error(response.statusText)
        return
    }

    return responseToDataUrl(response)
}

export default fetchImage
