import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import {
    LAST_UPDATE_TIME_STAMP,
    READ_STORAGE_FLAG,
} from 'src/common-ui/containers/UpdateNotifBanner/constants'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'

/*
 * This exists as we had a suspicion that sometimes browsers would forcefully evict all extension data.
 * To in/validate that we put this flag and periodically check it to see if it's still there. In
 * the case of a full data eviction, it should be gone.
 *
 * socialTags collection chosen as it's long abandoned but still exists in the DB schema. Thus less work.
 */

export const CHECK_MEMEX_UPDATE_ALARM_NAME = 'check-memex-update-alarm'

export async function checkForUpdates() {
    const isStaging =
        process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
        process.env.NODE_ENV === 'development'
    const baseUrl = isStaging
        ? CLOUDFLARE_WORKER_URLS.staging
        : CLOUDFLARE_WORKER_URLS.production
    const url = `${baseUrl}/checkForUpdates`

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })

    const responseJSON = await response.json()
    const hasUpdate = parseFloat(responseJSON.hasUpdate)
    const lastUpdateTimeStamp = await getLocalStorage(LAST_UPDATE_TIME_STAMP)
    if (
        hasUpdate > lastUpdateTimeStamp ||
        (hasUpdate && !lastUpdateTimeStamp)
    ) {
        await setLocalStorage(READ_STORAGE_FLAG, false)
        await setLocalStorage(LAST_UPDATE_TIME_STAMP, hasUpdate)
    }
}
