import { extractIdFromUrl, isUrlYTVideo } from 'src/util/youtube-url'
import { MenuItemProps } from './types'

export const annotationMenuItems: MenuItemProps[] = [
    {
        name: 'YouTube Timestamp',
        isDisabled: !isUrlYTVideo(document.location.href),
        getTextToInsert() {
            const videoEl = document.querySelector<HTMLVideoElement>(
                '.video-stream',
            )

            const timestampSecs = Math.trunc(videoEl?.currentTime ?? 0)
            const humanTimestamp = `${Math.floor(timestampSecs / 60)}:${(
                timestampSecs % 60
            )
                .toString()
                .padStart(2, '0')}`

            const videoId = extractIdFromUrl(document.location.href)

            return `[${humanTimestamp}](https://youtu.be/${videoId}?t=${timestampSecs})`
        },
    },
    {
        name: 'Link',
        getTextToInsert() {
            return '[LinkText](url)'
        },
    },
]
