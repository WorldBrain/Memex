export const ytVideoUrlPattern = /^.*(?:(?:youtu.be\/)|(?:v\/)|(?:\/u\/\w\/)|(?:embed\/)|(?:watch\?))\??(?:v=)?([^#&?]*).*/

export const extractIdFromUrl = (url: string): string => {
    const [, videoId] = url.match(ytVideoUrlPattern) ?? []

    if (!videoId?.length) {
        throw new Error('Could not extract YouTube video ID from URL: ' + url)
    }

    return videoId
}

export const isUrlYTVideo = (url: string): boolean =>
    ytVideoUrlPattern.test(url)
