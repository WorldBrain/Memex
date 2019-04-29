import { browser } from 'webextension-polyfill-ts'
import responseToDataUrl from 'response-to-data-url'

// Get a tab's fav-icon (website logo) as a data URL
async function getFavIcon({ tabId }: { tabId: number }) {
    const tab = await browser.tabs.get(tabId)

    if (tab.favIconUrl == null) {
        return undefined
    }

    return fetchFavIcon(tab.favIconUrl)
}

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

export default getFavIcon

export class FavIconFetchError extends Error {}
