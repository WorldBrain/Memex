import { CronJob } from 'cron'

import analytics from '../'
import { STORAGE_KEYS, SCHEDULES, DAY_IN_MS } from '../constants'

/*
 * The purpose of this module is to attempt reimplement standard active user metrics
 * in Piwik analytics using custom non-user-invoked events. We need to do this as we're
 * repurposing the default active user count to mean "installed count" by sending an event everyday.
 */

const getDaysInMonth = (date = new Date()) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()

/**
 * @param {'month'|'week'|'day'} period
 */
const getActivePeriodVars = period => {
    switch (period) {
        case 'month':
            return {
                storageKey: STORAGE_KEYS.WEEKLY_ACTIVITY,
                action: 'Monthly activity ping',
                numDays: getDaysInMonth(),
            }
        case 'week':
            return {
                storageKey: STORAGE_KEYS.WEEKLY_ACTIVITY,
                action: 'Weekly activity ping',
                numDays: 7,
            }
        case 'day':
        default:
            return {
                storageKey: STORAGE_KEYS.DAILY_ACTIVITY,
                action: 'Daily activity ping',
                numDays: 1,
            }
    }
}

/**
 * @param {'month'|'week'|'day'} period
 * @returns {() => Promise<void>} Function affording checking of the last activity event ping for specified time `period`,
 *  sending off a new event if determined to be needed.
 */
const attemptActiveUserPing = period => {
    const { storageKey, action, numDays } = getActivePeriodVars(period)

    return async function() {
        const now = Date.now()
        const {
            [storageKey]: lastPing,
            [STORAGE_KEYS.SEARCH]: lastSearch,
        } = await browser.storage.local.get({
            [storageKey]: 0,
            [STORAGE_KEYS.SEARCH]: 0,
        })

        // If at least `numDays` since the last active user ping, track event
        if (now - lastPing >= DAY_IN_MS * numDays) {
            // Only send the event if last search done within current period (active user)
            if (now - lastSearch < DAY_IN_MS * numDays) {
                analytics.trackEvent({ category: 'Periodic', action })
            }

            // Update last ping time to stop further attempts in current period, regardless if active event was sent
            browser.storage.local.set({ [storageKey]: now })
        }
    }
}

const jobs = [
    new CronJob({
        cronTime: SCHEDULES.EVERY_HOUR(),
        start: true,
        /**
         * Sends a custom non-user-invoked event to signify an installed extension.
         */
        async onTick() {
            const now = Date.now()
            const {
                [STORAGE_KEYS.DAILY_INSTALL]: lastPing,
            } = await browser.storage.local.get({
                [STORAGE_KEYS.DAILY_INSTALL]: 0,
            })

            // If at least a day since the last install ping, do it again and update timestamp
            if (now - lastPing >= DAY_IN_MS) {
                await analytics.trackEvent({
                    category: 'Periodic',
                    action: 'Install ping',
                })

                await browser.storage.local.set({
                    [STORAGE_KEYS.DAILY_INSTALL]: now,
                })
            }
        },
    }),
    // User activity jobs
    new CronJob({
        cronTime: SCHEDULES.EVERY_HOUR(),
        start: true,
        onTick: attemptActiveUserPing('week'),
    }),
    new CronJob({
        cronTime: SCHEDULES.EVERY_HOUR(),
        start: true,
        onTick: attemptActiveUserPing('month'),
    }),
    new CronJob({
        cronTime: SCHEDULES.EVERY_HOUR(),
        start: true,
        onTick: attemptActiveUserPing('day'),
    }),
]

export default jobs
