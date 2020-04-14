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
                category: 'Annotations',
                action: 'createWithTags',
            }),
        ).toBe(true)
        await activityPings.storeActivity({
            category: 'Annotations',
            action: 'createWithTags',
        })

        await activityPings.maybePing()
        expect(analytics.popNew()).toEqual([
            {
                eventArgs: {
                    category: 'ActivityPings',
                    action: 'daily',
                    value: { usedFeatures: ['Annotations'] },
                },
            },
        ])
        expect(settings.settings).toEqual({
            lastPingTimestamps: { daily: firstPing, weekly: 1, monthly: 1 },
            pendingActivityPings: {
                daily: [],
                weekly: ['Annotations'],
                monthly: ['Annotations'],
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
                    value: { usedFeatures: ['Annotations'] },
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
                monthly: ['Annotations'],
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
                    value: { usedFeatures: ['Annotations'] },
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
                category: 'Annotations',
                action: 'createWithTags',
            }),
        ).toBe(true)
        await activityPings.storeActivity({
            category: 'Annotations',
            action: 'createWithTags',
        })

        activityPings._getNow = () => firstPing
        await activityPings.maybePing()
        expect(analytics.popNew()).toEqual([expect.objectContaining({})])
        expect(settings.settings).toEqual({
            lastPingTimestamps: { daily: firstPing, weekly: 1, monthly: 1 },
            pendingActivityPings: {
                daily: [],
                weekly: ['Annotations'],
                monthly: ['Annotations'],
            },
        })

        activityPings._getNow = () => firstPing + 1000 * 60 * 3
        await activityPings.maybePing()
        expect(settings.settings).toEqual({
            lastPingTimestamps: { daily: firstPing, weekly: 1, monthly: 1 },
            pendingActivityPings: {
                daily: [],
                weekly: ['Annotations'],
                monthly: ['Annotations'],
            },
        })
    })
})
