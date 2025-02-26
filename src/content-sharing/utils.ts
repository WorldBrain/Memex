import { getPageLinkPath } from '@worldbrain/memex-common/lib/content-sharing/utils'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

export * from '@worldbrain/memex-common/lib/content-sharing/utils'

/** NOTE: Only for use in Memex extension, as it assumes env is on process.env.NODE_ENV */
export function getPageLinkUrl(options: {
    remoteListId: AutoPk
    remoteListEntryId: AutoPk
    collaborationKey?: string
}) {
    return `${getBaseUrl()}${getPageLinkPath({
        remoteListId: options.remoteListId,
        remoteListEntryId: options.remoteListEntryId,
        collaborationKey: options.collaborationKey,
    })}`
}

function getBaseUrl() {
    if (process.env.NODE_ENV === 'production') {
        return `https://memex.social`
    }
    if (process.env.USE_FIREBASE_EMULATOR === 'true') {
        return 'http://localhost:3000'
    }
    return `https://staging.memex.social`
}
