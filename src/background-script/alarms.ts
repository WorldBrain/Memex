import { Alarms } from 'webextension-polyfill-ts'

import BackgroundScript from '.'
import { QUOTA_USAGE_WARN_PERC } from './constants'
import { EVENT_NOTIFS } from 'src/notifications/notifications'

export interface AlarmConfig extends Alarms.CreateAlarmInfoType {
    listener: (bg: BackgroundScript) => void
}

export interface AlarmsConfig {
    [key: string]: AlarmConfig
}

export default {
    storageQuotaCheck: {
        periodInMinutes: 60,
        async listener(bg) {
            const { usage, quota } = await navigator.storage.estimate()
            const percUsed = Math.trunc((usage / quota) * 100)

            if (percUsed >= QUOTA_USAGE_WARN_PERC) {
                await bg.sendNotification(EVENT_NOTIFS.quota_warning.id)
            }
        },
    },
} as AlarmsConfig
