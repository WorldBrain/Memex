import PersonalAnalyticsStorage from '@worldbrain/memex-common/lib/analytics/storage'
import type * as commonAnalyticsTypes from '@worldbrain/memex-common/lib/analytics/types'
import { LocalExtensionSettings } from 'src/background-script/types'
import { BrowserSettingsStore } from 'src/util/settings'
import { updateLastActive } from '../utils'
import { AnalyticsEvent, AnalyticsEvents } from '../types'
import { AnalyticsInterface } from './types'
export class AnalyticsBackground {
    remoteFunctions: AnalyticsInterface

    constructor(
        public options: {
            getAnalyticsStorage(): Promise<PersonalAnalyticsStorage>
            getUserId(): Promise<number | string | null>
            localExtSettingStore: BrowserSettingsStore<LocalExtensionSettings>
        },
    ) {
        this.remoteFunctions = {
            trackEvent: this.trackEvent,
            rawTrackEvent: this.rawTrackEvent,
            updateLastActive,
        }
    }

    async setup() {
        // don't await, because it shouldn't block the extension setup
        this.maybeTrackInstall()
    }

    async maybeTrackInstall() {
        const userId = await this.options.getUserId()
        if (!userId) {
            return
        }
        const alreadyTrackedInstall = await this.options.localExtSettingStore.get(
            'trackedInstall',
        )
        if (alreadyTrackedInstall) {
            return
        }
        const installTime = await this.options.localExtSettingStore.get(
            'installTimestamp',
        )
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
        await this.options.localExtSettingStore.set('trackedInstall', true)
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
