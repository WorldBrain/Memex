import { blobToDataUrl } from 'src/util/blob-to-data-url'

export async function fetchFavIcon(url: string): Promise<string> {
    if (url == null) {
        throw new FavIconFetchError('Cannot fetch missing URL')
    }

    const response = await fetch(url)

    if (response.status >= 400 && response.status < 600) {
        throw new FavIconFetchError(response.statusText)
    }

    const blob = await response.blob()
    return blobToDataUrl(blob)
}

export class FavIconFetchError extends Error {}
