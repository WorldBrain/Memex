import { blobToDataUrl } from 'src/util/blob-to-data-url'

function getFavIconURLFromDOM(url: string, doc: Document): string {
    const favEl = doc.querySelector<HTMLLinkElement>('link[rel*="icon"]')
    const urlPage = new URL(url)
    if (favEl?.href) {
        const urlFavIcon = new URL(favEl.href)
        if (urlFavIcon.protocol.startsWith('chrome-extension')) {
            return favEl.href.replace(urlFavIcon.origin, urlPage.origin)
        } else {
            return favEl.href
        }
    } else {
        return `${urlPage.origin}/favicon.ico`
    }
}

async function getFavIcon(favIconUrl: string): Promise<string> {
    const response = await fetch(favIconUrl)

    if (response.status >= 400 && response.status < 600) {
        throw new Error(`Bad response from server: ${response.status}`)
    }
    const blob = await response.blob()
    return blobToDataUrl(blob)
}

const extractFavIcon = (url: string, doc = document) => {
    try {
        return getFavIcon(getFavIconURLFromDOM(url, doc))
    } catch (err) {
        console.log(err)

        return undefined // carry on without fav-icon
    }
}

export default extractFavIcon
