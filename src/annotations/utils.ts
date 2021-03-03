import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { TextTruncator } from './types'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

export const LAST_SHARED_ANNOTS =
    '@ContentSharing-last-shared-annotation-timestamp'

export const generateUrl = (params: { pageUrl: string; now: () => number }) => {
    const { pageUrl, now } = params
    return `${normalizeUrl(pageUrl)}/#${now()}`
}

export const isUrlForAnnotation = (url: string): boolean =>
    /#\d{10,}$/.test(url)

export const getLastSharedAnnotationTimestamp = (): Promise<
    number | undefined
> => getLocalStorage(LAST_SHARED_ANNOTS)

export const setLastSharedAnnotationTimestamp = (
    timestamp = Date.now(),
): Promise<void> => setLocalStorage(LAST_SHARED_ANNOTS, timestamp)

export const truncateText: TextTruncator = (
    text,
    { maxLength = 400, maxLineBreaks = 8 } = {
        maxLength: 400,
        maxLineBreaks: 8,
    },
) => {
    if (text.length > maxLength) {
        let checkedLength = maxLength

        // Find the next space to cut off at
        while (
            text.charAt(checkedLength) !== ' ' &&
            checkedLength < text.length
        ) {
            checkedLength++
        }

        return {
            isTooLong: true,
            text: text.slice(0, checkedLength) + '…',
        }
    }

    for (let i = 0, newlineCount = 0; i < text.length; ++i) {
        if (text[i] === '\n') {
            newlineCount++
            if (newlineCount > maxLineBreaks) {
                return {
                    isTooLong: true,
                    text: text.slice(0, i) + '…',
                }
            }
        }
    }

    return { isTooLong: false, text }
}
