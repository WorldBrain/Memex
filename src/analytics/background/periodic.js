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
 * @returns {any} Object containing different constants that apply to specific period.
 */
const getActivePeriodVars = period => {
    switch (period) {
        case 'month':
            return {
                installKey: STORAGE_KEYS.MONTHLY_INSTALL,
                activityKey: STORAGE_KEYS.MONTHLY_ACTIVITY,
                action: 'Monthly',
                time: getDaysInMonth() * DAY_IN_MS,
            }
        case 'week':
            return {
                installKey: STORAGE_KEYS.WEEKLY_INSTALL,
                activityKey: STORAGE_KEYS.WEEKLY_ACTIVITY,
                action: 'Weekly',
                time: 7 * DAY_IN_MS,
            }
        case 'day':
        default:
            return {
                installKey: STORAGE_KEYS.DAILY_INSTALL,
                activityKey: STORAGE_KEYS.DAILY_ACTIVITY,
                action: 'Daily',
                time: 1 * DAY_IN_MS,
            }
    }
}

/**
 * @param {'month'|'week'|'day'} period
 * @returns {() => Promise<void>} Function affording checking of the last activity event ping for specified time `period`,
 *  sending off a new event if determined to be needed.
 */
function attemptPeriodicPing(period) {
    const periodConsts = getActivePeriodVars(period)

    return async function() {
        const now = Date.now()
        const {
            [periodConsts.activityKey]: lastActivityPing,
            [periodConsts.installKey]: lastInstallPing,
            [STORAGE_KEYS.SEARCH]: lastSearch,
        } = await browser.storage.local.get({
            [periodConsts.activityKey]: 0,
            [periodConsts.installKey]: 0,
            [STORAGE_KEYS.SEARCH]: 0,
        })

        // If at least the period time since the last active user ping, try to track event
        if (now - lastActivityPing >= periodConsts.time) {
            // Only send the event if last search done within current period (active user)
            if (now - lastSearch < periodConsts.time) {
                analytics.trackEvent({
                    category: 'Periodic',
                    action: `${periodConsts.action} activity ping`,
                })
            }

            // Update last ping time to stop further attempts in current period, regardless if active event was sent
            await browser.storage.local.set({ [periodConsts.activityKey]: now })
        }

        // If at least the period time since the last install ping, track event
        if (now - lastInstallPing >= periodConsts.time) {
            analytics.trackEvent({
                category: 'Periodic',
                action: `${periodConsts.action} install ping`,
            })

            await browser.storage.local.set({ [periodConsts.installKey]: now })
        }
    }
}

const createPeriodicEventJob = period =>
    new CronJob({
        cronTime: SCHEDULES.EVERY_HOUR(),
        start: true,
        onTick: attemptPeriodicPing(period),
    })

// Schedule all periodic ping attempts at a random minute past the hour, every hour
const jobs = [
    createPeriodicEventJob('month'),
    createPeriodicEventJob('week'),
    createPeriodicEventJob('day'),
]

export default jobs
