import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import type { TextTruncator } from './types'
import type { AnnotationShareOpts } from './annotation-save-logic'

export const __OLD_LAST_SHARED_ANNOTS =
    '@ContentSharing-last-shared-annotation-timestamp'

export const generateAnnotationUrl = (params: {
    pageUrl: string
    now: () => number
}) => {
    const { pageUrl, now } = params
    return `${normalizeUrl(pageUrl)}/#${now()}`
}

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

export function shareOptsToPrivacyLvl(
    shareOpts?: AnnotationShareOpts,
): AnnotationPrivacyLevels {
    if (shareOpts?.shouldShare) {
        return shareOpts.isBulkShareProtected
            ? AnnotationPrivacyLevels.SHARED_PROTECTED
            : AnnotationPrivacyLevels.SHARED
    }

    return shareOpts?.isBulkShareProtected
        ? AnnotationPrivacyLevels.PROTECTED
        : AnnotationPrivacyLevels.PRIVATE
}
