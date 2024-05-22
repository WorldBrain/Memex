import { pageActionAllowed } from '@worldbrain/memex-common/lib/subscriptions/storage'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import { FakeAnalytics } from 'src/analytics/mock'
import { createSyncSettingsStore } from 'src/sync-settings/util'
import {
    COUNTER_STORAGE_KEY,
    DEFAULT_COUNTER_STORAGE_VALUE,
    DEFAULT_POWERUP_LIMITS,
    DEFAULT_TESTING_EMAIL,
    DEFAULT_TRIAL_PERIOD,
    SIGNUP_TIMESTAMP_STORAGE_KEY,
} from '@worldbrain/memex-common/lib/subscriptions/constants'
import { AI_PROMPT_DEFAULTS } from 'src/sidebar/annotations-sidebar/constants'
import {
    AIActionAllowed,
    enforceTrialPeriod30Days,
} from '@worldbrain/memex-common/lib/subscriptions/storage'

describe('Ribbon logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    async function setupTest(
        device: UILogicTestDevice,
        options: {
            dependencies?: any
        } = {},
    ) {
        const { backgroundModules, browserAPIs } = device
        const analytics = new FakeAnalytics()

        const syncSettings = createSyncSettingsStore({
            syncSettingsBG: backgroundModules.syncSettings,
        })

        // set the default timestam of user to be out of trial
        await giveAndSaveTimeStampFromXdaysAgo(
            DEFAULT_TRIAL_PERIOD + 10,
            browserAPIs,
        )

        return {
            analytics,
            browserAPIs: browserAPIs,
            collectionsBG: backgroundModules.customLists,
            syncSettings,
            pageIndexingBG: backgroundModules.pages,
        }
    }

    describe('pageActionAllowed', () => {
        it('should allow action if person is still in trial', async ({
            device,
        }) => {
            const {
                browserAPIs,
                analytics,
                collectionsBG,
                pageIndexingBG,
            } = await setupTest(device)

            const trialStartDate = giveTimeStampFromXdaysAgo(10)
            await browserAPIs.storage.local.set({
                [SIGNUP_TIMESTAMP_STORAGE_KEY]: trialStartDate,
            })

            const result = await enforceTrialPeriod30Days(
                browserAPIs,
                trialStartDate,
            )

            expect(result).toBe(true)
        })
        it('should allow action if page is already saved', async ({
            device,
        }) => {
            const {
                browserAPIs,
                analytics,
                collectionsBG,
                pageIndexingBG,
            } = await setupTest(device)
            await pageIndexingBG.indexPage({
                fullUrl: 'http://example.com',
            })

            const result = await pageActionAllowed(
                browserAPIs,
                analytics,
                collectionsBG,
                'http://example.com',
                false,
            )
            expect(result).toBe(true)
        })
        it('should allow action if user has bookmarking powerup AND page not saved previously AND NOT in trial', async ({
            device,
        }) => {
            const { browserAPIs, analytics, collectionsBG } = await setupTest(
                device,
            )

            const fakeStorageEntry = {
                ...DEFAULT_COUNTER_STORAGE_VALUE,
                pU: {
                    ...DEFAULT_COUNTER_STORAGE_VALUE.pU,
                    bookmarksPowerUp: true,
                },
            }

            await browserAPIs.storage.local.set({
                [COUNTER_STORAGE_KEY]: fakeStorageEntry,
            })

            const result = await pageActionAllowed(
                browserAPIs,
                analytics,
                collectionsBG,
                null,
                false,
            )

            expect(result).toBe(true)
        })
        it('should allow action if user has NO bookmarking powerup AND out of trial AND page limit not hit AND current page not saved previously', async ({
            device,
        }) => {
            const { browserAPIs, analytics, collectionsBG } = await setupTest(
                device,
            )

            const fakeStorageEntry = {
                ...DEFAULT_COUNTER_STORAGE_VALUE,
                c: DEFAULT_POWERUP_LIMITS.bookmarksPowerUp - 10,
            }

            await browserAPIs.storage.local.set({
                [COUNTER_STORAGE_KEY]: fakeStorageEntry,
            })

            const result = await pageActionAllowed(
                browserAPIs,
                analytics,
                collectionsBG,
                null,
                false,
            )

            expect(result).toBe(true)
        })
        it('should prevent action if user has NO bookmarking powerup AND out of trial AND page limit is hit AND current page not saved previously', async ({
            device,
        }) => {
            const { browserAPIs, analytics, collectionsBG } = await setupTest(
                device,
            )

            const fakeStorageEntry = {
                ...DEFAULT_COUNTER_STORAGE_VALUE,
                c: DEFAULT_POWERUP_LIMITS.bookmarksPowerUp + 10,
            }

            await browserAPIs.storage.local.set({
                [COUNTER_STORAGE_KEY]: fakeStorageEntry,
            })

            const result = await pageActionAllowed(
                browserAPIs,
                analytics,
                collectionsBG,
                null,
                false,
            )

            expect(result).toBe(false)
        })
    })
    describe('AIActionAllowed', () => {
        it('should allow action if user in in trial time', async ({
            device,
        }) => {
            const { browserAPIs, analytics, collectionsBG } = await setupTest(
                device,
            )

            await giveAndSaveTimeStampFromXdaysAgo(10, browserAPIs)

            const fakeStorageEntry = {
                ...DEFAULT_COUNTER_STORAGE_VALUE,
            }

            await browserAPIs.storage.local.set({
                [COUNTER_STORAGE_KEY]: fakeStorageEntry,
            })

            const result = await AIActionAllowed(
                browserAPIs,
                analytics,
                false,
                false,
                'gpt-3',
            )

            expect(result).toBe(true)
        })
        it('should allow action if user is out of trial time and below the sessionlimit', async ({
            device,
        }) => {
            const { browserAPIs, analytics, collectionsBG } = await setupTest(
                device,
            )

            const fakeStorageEntry = {
                ...DEFAULT_COUNTER_STORAGE_VALUE,
                cQ: DEFAULT_POWERUP_LIMITS.AIpowerup - 10,
            }

            await browserAPIs.storage.local.set({
                [COUNTER_STORAGE_KEY]: fakeStorageEntry,
            })

            const result = await AIActionAllowed(
                browserAPIs,
                analytics,
                false,
                false,
                'gpt-3',
            )

            expect(result).toBe(true)
        })
        it('should allow action if user has AI own key powerup and key', async ({
            device,
        }) => {
            const { browserAPIs, analytics, collectionsBG } = await setupTest(
                device,
            )

            const fakeStorageEntry = {
                ...DEFAULT_COUNTER_STORAGE_VALUE,
                pU: {
                    ...DEFAULT_COUNTER_STORAGE_VALUE.pU,
                    AIpowerupOwnKey: true,
                },
            }

            await browserAPIs.storage.local.set({
                [COUNTER_STORAGE_KEY]: fakeStorageEntry,
            })

            const result = await AIActionAllowed(
                browserAPIs,
                analytics,
                true,
                false,
                'gpt-3',
            )

            expect(result).toBe(true)
        })
        it('should allow action if user has AIpowerupOwnKey powerup AND no key AND not hit free quota', async ({
            device,
        }) => {
            const { browserAPIs, analytics, collectionsBG } = await setupTest(
                device,
            )

            const fakeStorageEntry = {
                ...DEFAULT_COUNTER_STORAGE_VALUE,
                cQ: DEFAULT_POWERUP_LIMITS.AIpowerup - 10,
                pU: {
                    ...DEFAULT_COUNTER_STORAGE_VALUE.pU,
                    AIpowerupOwnKey: true,
                },
            }

            await browserAPIs.storage.local.set({
                [COUNTER_STORAGE_KEY]: fakeStorageEntry,
            })

            const result = await AIActionAllowed(
                browserAPIs,
                analytics,
                false,
                false,
                'gpt-3',
            )

            expect(result).toBe(true)
        })

        it('should prevent action if user has AIpowerupOwnKey powerup AND no key AND over free tier limit', async ({
            device,
        }) => {
            const { browserAPIs, analytics, collectionsBG } = await setupTest(
                device,
            )

            const fakeStorageEntry = {
                ...DEFAULT_COUNTER_STORAGE_VALUE,
                cQ: DEFAULT_POWERUP_LIMITS.AIpowerup + 10,
                pU: {
                    ...DEFAULT_COUNTER_STORAGE_VALUE.pU,
                    AIpowerupOwnKey: true,
                },
            }

            await browserAPIs.storage.local.set({
                [COUNTER_STORAGE_KEY]: fakeStorageEntry,
            })

            const result = await AIActionAllowed(
                browserAPIs,
                analytics,
                false,
                false,
                'gpt-3',
            )

            expect(result).toBe(false)
        })

        it('should allow action if user has AIpowerupOwnKey powerup AND has key AND using GPT-3 but over free tier limit', async ({
            device,
        }) => {
            const { browserAPIs, analytics, collectionsBG } = await setupTest(
                device,
            )

            const fakeStorageEntry = {
                ...DEFAULT_COUNTER_STORAGE_VALUE,
                cQ: DEFAULT_POWERUP_LIMITS.AIpowerup + 10,
                pU: {
                    ...DEFAULT_COUNTER_STORAGE_VALUE.pU,
                    AIpowerupOwnKey: true,
                },
            }

            await browserAPIs.storage.local.set({
                [COUNTER_STORAGE_KEY]: fakeStorageEntry,
            })

            const result = await AIActionAllowed(
                browserAPIs,
                analytics,
                true,
                false,
                'gpt-3',
            )

            expect(result).toBe(true)
        })

        it('should prevent action if user has NO AI powerup AND no Key AND hit the limit', async ({
            device,
        }) => {
            const { browserAPIs, analytics, collectionsBG } = await setupTest(
                device,
            )

            const fakeStorageEntry = {
                ...DEFAULT_COUNTER_STORAGE_VALUE,
                cQ: DEFAULT_POWERUP_LIMITS.AIpowerup + 10,
            }

            await browserAPIs.storage.local.set({
                [COUNTER_STORAGE_KEY]: fakeStorageEntry,
            })

            const result = await AIActionAllowed(
                browserAPIs,
                analytics,
                false,
                false,
                'gpt-3',
            )
            expect(result).toBe(false)
        })
    })

    describe('Check for the stripe plan and give back my current subscription status.', () => {
        it('should return the subscriptionStatus.bookmarks equal to the stripe response', async ({
            device,
        }) => {
            // const { browserAPIs, analytics, collectionsBG } = await setupTest(
            //     device,
            // )
            // const email = DEFAULT_TESTING_EMAIL
            // const subscriptionStatus = await checkStripePlan(email, browserAPIs)
            // console.log(subscriptionStatus)
            // expect(subscriptionStatus.bookmarksPowerUp).toBe(true)
        })
    })
    describe('Check if the user is still in trial period', () => {
        it('If signup date available in request, save to local storage', async ({
            device,
        }) => {})

        it('Compared with signup date given, check if the current time is more than trial period', async ({
            device,
        }) => {})
    })
    describe('Check if the user can save page', () => {
        it('Given a url it checks if I can save it or not based on either being in trial, having reached a quota or having the bookmarking powerup', async ({
            device,
        }) => {
            // metadata to check again:
            // isAlreadySaved
            // is allowed
        })
        it('Given a url it checks if I can save it or not', async ({
            device,
        }) => {})
    })
    describe('Check if the user can save page', () => {
        it('Given a url it checks if I can save it or not based on either being in trial, having reached a quota or having the bookmarking powerup', async ({
            device,
        }) => {})
    })
})

function giveTimeStampFromXdaysAgo(days) {
    const trialStartDate = new Date()
    trialStartDate.setDate(trialStartDate.getDate() - days)
    const unixTimestamp = trialStartDate.getTime()
    return unixTimestamp
}
async function giveAndSaveTimeStampFromXdaysAgo(days, browserAPIs) {
    // generate signup date from 40 days ago so user is out of trial
    const trialStartDate = giveTimeStampFromXdaysAgo(days)
    await browserAPIs.storage.local.set({
        [SIGNUP_TIMESTAMP_STORAGE_KEY]: trialStartDate,
    })
    return true
}
