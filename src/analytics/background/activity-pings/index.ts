import { Analytics, AnalyticsEvent, AnalyticsEvents } from '../../types'
import { SettingStore } from 'src/util/settings'
import { ActivityPingSettings, ActivityPingFrequency } from './types'
import { ACTIVITY_PINGS, DEFAULT_PING_INTERVALS } from './constants'
import { bindMethod } from 'src/util/functions'

export default class ActivityPings {
    checkPingInterval = 1000 * 60 * 60
    activityPingIntervals = DEFAULT_PING_INTERVALS
    pendingPings: ActivityPingSettings['pendingActivityPings']
    lastPings: ActivityPingSettings['lastPingTimestamps']

    constructor(
        private options: {
            analytics: Analytics
            settings: SettingStore<ActivityPingSettings>
        },
    ) {}

    async setup() {
        this._setInterval(() => this.maybePing(), this.checkPingInterval)

        this.lastPings = await this.options.settings.get('lastPingTimestamps')
        if (!this.lastPings) {
            const now = this._getNow()
            this.lastPings = {
                daily: now,
                weekly: now,
                monthly: now,
            }
            await this.options.settings.set(
                'lastPingTimestamps',
                this.lastPings,
            )
        }

        this.pendingPings = await this.options.settings.get(
            'pendingActivityPings',
        )
        if (!this.pendingPings) {
            this.pendingPings = {
                daily: [],
                weekly: [],
                monthly: [],
            }
            await this.options.settings.set(
                'pendingActivityPings',
                this.pendingPings,
            )
        }
    }

    isActivityPing(event: AnalyticsEvent) {
        return !!ACTIVITY_PINGS[event.category]?.[event.action]
    }

    async storeActivity(event: AnalyticsEvent) {
        const category = event.category as keyof AnalyticsEvents
        for (const frequency of Object.keys(this.pendingPings)) {
            if (this.pendingPings[frequency].includes(category)) {
                return
            }

            this.pendingPings[frequency].push(category)
            await this.options.settings.set(
                'pendingActivityPings',
                this.pendingPings,
            )
        }
    }

    async maybePing() {
        const needed = await this.needsPing()
        for (const frequency of Object.keys(
            this.pendingPings,
        ) as ActivityPingFrequency[]) {
            if (needed[frequency]) {
                await this.sendPing(frequency)
                await this.updateActivityPings(frequency)
            }
        }
    }

    async sendPing(frequency: ActivityPingFrequency) {
        await this.options.analytics.trackEvent({
            category: 'ActivityPings',
            action: frequency,
            value: { usedFeatures: this.pendingPings[frequency] },
        })
    }

    async updateActivityPings(frequency: ActivityPingFrequency) {
        this.pendingPings[frequency] = []
        await this.options.settings.set(
            'pendingActivityPings',
            this.pendingPings,
        )

        this.lastPings[frequency] = this._getNow()
        await this.options.settings.set('lastPingTimestamps', this.lastPings)
    }

    async needsPing(): Promise<
        false | { [Frequency in ActivityPingFrequency]: boolean }
    > {
        const needed = { daily: false, weekly: false, monthly: false }

        for (const frequency of Object.keys(
            needed,
        ) as ActivityPingFrequency[]) {
            if (
                this._getNow() - this.lastPings[frequency] >
                this.activityPingIntervals[frequency]
            ) {
                needed[frequency] = true
            }
        }
        return needed
    }

    _setInterval = bindMethod(window, 'setInterval')
    _getNow = () => Date.now()
}
