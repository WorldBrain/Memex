import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'

/**
 * This exists as a bit of a hack so that the dashboard static list items in the sidebar can
 * use string IDs, like the rest of the cache-based lists, while remaining to be use their
 * somewhat unique, consistent IDs.
 */
export const SPECIAL_LIST_STRING_IDS = {
    INBOX: SPECIAL_LIST_IDS.INBOX.toString(),
    MOBILE: SPECIAL_LIST_IDS.MOBILE.toString(),
    FEED: SPECIAL_LIST_IDS.FEED.toString(),
}
