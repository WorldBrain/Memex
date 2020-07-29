import ActivityPings from '.'
import { FakeAnalytics } from 'src/analytics/mock'
import { MemorySettingStore } from 'src/util/settings'
import { ActivityPingSettings } from './types'

describe('Analytics activity pings', () => {
    it('should send activity pings', async () => {
        const analytics = new FakeAnalytics()
        const settings = new MemorySettingStore<ActivityPingSettings>()
        const activityPings = new ActivityPings({
            analytics,
            settings,
        })
        activityPings._getNow = () => 1
        await activityPings.setup()
        expect(settings.settings).toEqual({
            lastPingTimestamps: { daily: 1, weekly: 1, monthly: 1 },
            pendingActivityPings: { daily: [], weekly: [], monthly: [] },
        })

        await activityPings.maybePing()
        expect(analytics.popNew()).toEqual([])

        const firstPing = 1000 * 60 * 60 * 24 + 2
        activityPings._getNow = () => firstPing
        expect(
            activityPings.isActivityPing({
                category: 'ActivityPings',
                action: 'daily',
            }),
        ).toBe(true)
        await activityPings.storeActivity({
            category: 'ActivityPings',
            action: 'daily',
        })

        await activityPings.maybePing()
        expect(analytics.popNew()).toEqual([
            {
                eventArgs: {
                    category: 'ActivityPings',
                    action: 'daily',
                    value: { usedFeatures: ['ActivityPings'] },
                },
            },
        ])
        expect(settings.settings).toEqual({
            lastPingTimestamps: { daily: firstPing, weekly: 1, monthly: 1 },
            pendingActivityPings: {
                daily: [],
                weekly: ['ActivityPings'],
                monthly: ['ActivityPings'],
            },
        })

        const secondPing = 1000 * 60 * 60 * 24 * 7 + 4
        activityPings._getNow = () => secondPing
        await activityPings.maybePing()
        expect(analytics.popNew()).toEqual([
            {
                eventArgs: {
                    category: 'ActivityPings',
                    action: 'daily',
                    value: { usedFeatures: [] },
                },
            },
            {
                eventArgs: {
                    category: 'ActivityPings',
                    action: 'weekly',
                    value: { usedFeatures: ['ActivityPings'] },
                },
            },
        ])
        expect(settings.settings).toEqual({
            lastPingTimestamps: {
                daily: secondPing,
                weekly: secondPing,
                monthly: 1,
            },
            pendingActivityPings: {
                daily: [],
                weekly: [],
                monthly: ['ActivityPings'],
            },
        })

        const thirdPing = 1000 * 60 * 60 * 24 * 30 + 6
        activityPings._getNow = () => thirdPing
        await activityPings.maybePing()
        expect(analytics.popNew()).toEqual([
            {
                eventArgs: {
                    category: 'ActivityPings',
                    action: 'daily',
                    value: { usedFeatures: [] },
                },
            },
            {
                eventArgs: {
                    category: 'ActivityPings',
                    action: 'weekly',
                    value: { usedFeatures: [] },
                },
            },
            {
                eventArgs: {
                    category: 'ActivityPings',
                    action: 'monthly',
                    value: { usedFeatures: ['ActivityPings'] },
                },
            },
        ])
        expect(settings.settings).toEqual({
            lastPingTimestamps: {
                daily: thirdPing,
                weekly: thirdPing,
                monthly: thirdPing,
            },
            pendingActivityPings: { daily: [], weekly: [], monthly: [] },
        })
    })

    it('should not send daily activity pings too soon', async () => {
        const analytics = new FakeAnalytics()
        const settings = new MemorySettingStore<ActivityPingSettings>()
        const activityPings = new ActivityPings({
            analytics,
            settings,
        })
        activityPings._getNow = () => 1
        await activityPings.setup()
        expect(settings.settings).toEqual({
            lastPingTimestamps: { daily: 1, weekly: 1, monthly: 1 },
            pendingActivityPings: { daily: [], weekly: [], monthly: [] },
        })

        await activityPings.maybePing()
        expect(analytics.popNew()).toEqual([])

        const firstPing = 1000 * 60 * 60 * 24 + 2
        expect(
            activityPings.isActivityPing({
                category: 'ActivityPings',
                action: 'daily',
            }),
        ).toBe(true)
        await activityPings.storeActivity({
            category: 'ActivityPings',
            action: 'daily',
        })

        activityPings._getNow = () => firstPing
        await activityPings.maybePing()
        expect(analytics.popNew()).toEqual([expect.objectContaining({})])
        expect(settings.settings).toEqual({
            lastPingTimestamps: { daily: firstPing, weekly: 1, monthly: 1 },
            pendingActivityPings: {
                daily: [],
                weekly: ['ActivityPings'],
                monthly: ['ActivityPings'],
            },
        })

        activityPings._getNow = () => firstPing + 1000 * 60 * 3
        await activityPings.maybePing()
        expect(settings.settings).toEqual({
            lastPingTimestamps: { daily: firstPing, weekly: 1, monthly: 1 },
            pendingActivityPings: {
                daily: [],
                weekly: ['ActivityPings'],
                monthly: ['ActivityPings'],
            },
        })
    })
})
