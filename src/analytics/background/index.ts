import { Storage } from 'webextension-polyfill-ts'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { updateLastActive } from '../utils'
import { AnalyticsInterface } from './types'
import { bindMethod } from 'src/util/functions'
import ActivityPings from './activity-pings'
import { BrowserSettingsStore } from 'src/util/settings'
import { ActivityPingSettings } from './activity-pings/types'
import { AnalyticsEvent, AnalyticsEvents, Analytics } from '../types'

export class AnalyticsBackground {
    remoteFunctions: AnalyticsInterface
    activityPings: ActivityPings

    constructor(
        private analyticsManager: Analytics,
        options: {
            localBrowserStorage: Storage.LocalStorageArea
        },
    ) {
        this.remoteFunctions = {
            trackEvent: bindMethod(this, 'trackEvent'),
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
        makeRemotelyCallable(this.remoteFunctions)
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
}
