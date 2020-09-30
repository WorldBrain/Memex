import { browser } from 'webextension-polyfill-ts'
import responseToDataUrl from 'response-to-data-url'

export async function fetchFavIcon(url: string): Promise<string> {
    if (url == null) {
        throw new FavIconFetchError('Cannot fetch missing URL')
    }

    const response = await fetch(url)

    if (response.status >= 400 && response.status < 600) {
        throw new FavIconFetchError(response.statusText)
    }

    return responseToDataUrl(response)
}

export class FavIconFetchError extends Error {}
