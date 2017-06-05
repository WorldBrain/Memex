// Give a shorter (but broken) version of a URL for human consumption.

export default function shortUrl(url, maxLength = 50) {
    url = url.replace(/^https?:\/\//i, '')
    if (url.length > maxLength) { url = url.slice(0, maxLength - 3) + '...' }
    return url
}
