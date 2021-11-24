import { Storage } from 'webextension-polyfill-ts'
import { updateLastActive } from '../utils'
import { AnalyticsInterface } from './types'
import { AnalyticsEvent, AnalyticsEvents } from '../types'
import PersonalAnalyticsStorage from '@worldbrain/memex-common/lib/analytics/storage'
import type * as commonAnalyticsTypes from '@worldbrain/memex-common/lib/analytics/types'

export class AnalyticsBackground {
    remoteFunctions: AnalyticsInterface

    constructor(
        public options: {
            getAnalyticsStorage(): Promise<PersonalAnalyticsStorage>
            getUserId(): Promise<number | string | null>
            localBrowserStorage: Storage.LocalStorageArea
        },
    ) {
        this.remoteFunctions = {
            trackEvent: this.trackEvent,
            rawTrackEvent: this.rawTrackEvent,
            updateLastActive,
        }
    }

    async setup() {}

    async maybeTrackInstall(userId: number | string | null) {
        if (!userId) {
            return
        }
        const settingsKey = 'analytics.trackedInstall'
        const settings = await this.options.localBrowserStorage.get([
            settingsKey,
        ])
        const alreadyTrackedInstall = settings[settingsKey]
        if (alreadyTrackedInstall) {
            return
        }
        const installTime = await this._getInstallTime()
        if (!installTime) {
            return // should never happen
        }

        const storage = await this.options.getAnalyticsStorage()
        await storage.trackInstall({
            user: { type: 'user-reference', id: userId },
            time: installTime,
        })

        // writing this to the local storage, not the synced storage, because the install time
        // will not get overwritten if already existing. It's just to save some read costs.
        await this.options.localBrowserStorage.set({
            [settingsKey]: true,
        })
    }

    async _getInstallTime() {
        const key = 'installTimestamp'
        const settings = await this.options.localBrowserStorage.get([key])
        return settings[key]
    }

    trackEvent = async <Category extends keyof AnalyticsEvents>(
        event: AnalyticsEvent<Category>,
    ) => {
        await this.rawTrackEvent({
            type: `${event.category}::${event.action}`,
        })
    }

    rawTrackEvent = async (
        event: Omit<commonAnalyticsTypes.AnalyticsEvent, 'createdWhen'>,
    ) => {
        const userId = await this.options.getUserId()
        if (!userId) {
            return
        }

        const analyticsStorage = await this.options.getAnalyticsStorage()

        // don't await, we don't care if it fails
        analyticsStorage.trackEvent({
            user: { type: 'user-reference', id: userId },
            event: {
                createdWhen: Date.now(),
                ...event,
            },
        })
    }
}
