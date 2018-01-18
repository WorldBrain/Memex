import { CronJob } from 'cron'
import moment from 'moment-timezone'

import analytics from '../'
import { STORAGE_KEYS, SCHEDULES, TIMEZONE } from '../constants'

/*
 * The purpose of this module is to attempt reimplement standard active user metrics
 * in Piwik analytics using custom non-user-invoked events. We need to do this as we're
 * repurposing the default active user count to mean "installed count" by sending an event everyday.
 */

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
            }
        case 'week':
            return {
                installKey: STORAGE_KEYS.WEEKLY_INSTALL,
                activityKey: STORAGE_KEYS.WEEKLY_ACTIVITY,
                action: 'Weekly',
            }
        case 'day':
        default:
            return {
                installKey: STORAGE_KEYS.DAILY_INSTALL,
                activityKey: STORAGE_KEYS.DAILY_ACTIVITY,
                action: 'Daily',
            }
    }
}

/**
 * @param {'month'|'week'|'day'} period
 * @param {any} activePeriodVars
 * @returns {() => Promise<void>} Function affording checking of the last activity event ping for specified time `period`,
 *  sending off a new event if determined to be needed.
 */
const attemptPeriodicPing = (
    period,
    { installKey, activityKey, action },
) => async () => {
    const {
        [activityKey]: lastActivityPing,
        [installKey]: lastInstallPing,
        [STORAGE_KEYS.SEARCH]: lastSearch,
    } = await browser.storage.local.get({
        [activityKey]: 0,
        [installKey]: 0,
        [STORAGE_KEYS.SEARCH]: 0,
    })

    // Milestone is either first day of month/week or just midnight for day
    const lastMilestone = moment()
        .tz(TIMEZONE)
        .startOf(period)

    // If last ping was before the last milestone, try to track event for this period
    if (moment(lastActivityPing).isBefore(lastMilestone)) {
        // Only send the event if last search done within current period (active user)
        if (moment(lastSearch).isAfter(lastMilestone)) {
            analytics.trackEvent({
                category: 'Periodic',
                action: `${action} activity ping`,
            })
        }

        // Update last ping time to stop further attempts in current period, regardless if active event was sent
        await browser.storage.local.set({ [activityKey]: Date.now() })
    }

    // Same deal with install pings
    if (moment(lastInstallPing).isBefore(lastMilestone)) {
        analytics.trackEvent({
            category: 'Periodic',
            action: `${action} install ping`,
        })

        await browser.storage.local.set({ [installKey]: Date.now() })
    }
}

const createPeriodicEventJob = period =>
    new CronJob({
        cronTime: SCHEDULES.EVERY_HOUR(),
        start: true,
        onTick: attemptPeriodicPing(period, getActivePeriodVars(period)),
    })

// Schedule all periodic ping attempts at a random minute past the hour, every hour
const jobs = [
    createPeriodicEventJob('month'),
    createPeriodicEventJob('week'),
    createPeriodicEventJob('day'),
]

export default jobs
