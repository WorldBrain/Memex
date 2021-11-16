import { extractIdFromUrl } from 'src/util/youtube-url'

export const getYoutubeTimestamp = () => {
    const videoEl = document.querySelector<HTMLVideoElement>('.video-stream')

    const timestampSecs = Math.trunc(videoEl?.currentTime ?? 0)
    const humanTimestamp = `${Math.floor(timestampSecs / 60)}:${(
        timestampSecs % 60
    )
        .toString()
        .padStart(2, '0')}`

    const videoId = extractIdFromUrl(document.location.href)
    const videoURLwithTime = `https://youtu.be/${videoId}?t=${timestampSecs}`

    return [videoURLwithTime, humanTimestamp]
}
