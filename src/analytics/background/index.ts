import { Storage } from 'webextension-polyfill'
import { updateLastActive } from '../utils'
import { AnalyticsInterface } from './types'
import { bindMethod } from 'src/util/functions'
import ActivityPings from './activity-pings'
import { BrowserSettingsStore } from 'src/util/settings'
import { ActivityPingSettings } from './activity-pings/types'
import { AnalyticsEvent, AnalyticsEvents, Analytics } from '../types'
import { ClientAnalyticsEvent } from '@worldbrain/memex-common/lib/analytics/types'

export class AnalyticsBackground {
    remoteFunctions: AnalyticsInterface
    activityPings: ActivityPings

    constructor(
        private analyticsManager: Analytics,
        public options: {
            localBrowserStorage: Storage.LocalStorageArea
            sendBqEvent: (event: ClientAnalyticsEvent) => Promise<void>
        },
    ) {
        this.remoteFunctions = {
            trackEvent: bindMethod(this, 'trackEvent'),
            trackBqEvent: this.trackBqEvent,
            updateLastActive,
        }
        this.activityPings = new ActivityPings({
            analytics: analyticsManager,
            settings: new BrowserSettingsStore<ActivityPingSettings>(
                options.localBrowserStorage,
                { prefix: 'analyticsPings' },
            ),
        })
    }

    async setup() {
        await this.activityPings.setup()
    }

    async trackEvent<Category extends keyof AnalyticsEvents>(
        event: AnalyticsEvent<Category>,
    ) {
        if (this.activityPings.isActivityPing(event)) {
            this.activityPings.storeActivity(event)
        } else {
            this.analyticsManager.trackEvent(event)
        }
    }

    trackBqEvent: AnalyticsInterface['trackBqEvent'] = async (
        event: ClientAnalyticsEvent,
    ) => {
        this.options.sendBqEvent(event)
    }
}
