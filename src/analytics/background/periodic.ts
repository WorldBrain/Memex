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
 *  Affording checking of the last activity event ping for specified time `period`,
 *  sending off a new event if determined to be needed.
 * @param {'month'|'week'|'day'} period
 * @param {any} activePeriodVars
 */
const attemptPeriodicPing = async (
    period,
    { installKey, activityKey, action },
) => {
    const {
        [activityKey]: lastActivityPing,
        [installKey]: lastInstallPing,
        [STORAGE_KEYS.LAST_ACTIVE]: lastActive,
    } = await window['browser'].storage.local.get({
        [activityKey]: 0,
        [installKey]: 0,
        [STORAGE_KEYS.LAST_ACTIVE]: 0,
    })

    // Milestone is either first day of month/week or just midnight for day
    const lastMilestone = moment()
        .tz(TIMEZONE)
        .startOf(period)

    // If last ping was before the last milestone, try to track event for this period
    if (moment(lastActivityPing).isBefore(lastMilestone)) {
        // Only send the event if last search done within current period (active user)
        if (moment(lastActive).isAfter(lastMilestone)) {
            analytics.trackEvent({
                category: 'Periodic',
                action: `${action} activity ping`,
            })
        }

        // Update last ping time to stop further attempts in current period, regardless if active event was sent
        await window['browser'].storage.local.set({ [activityKey]: Date.now() })
    }

    // Same deal with install pings
    if (moment(lastInstallPing).isBefore(lastMilestone)) {
        analytics.trackEvent({
            category: 'Periodic',
            action: `${action} install ping`,
        })
        await window['browser'].storage.local.set({ [installKey]: Date.now() })
    }
}

// Schedule all periodic ping attempts at a random minute past the hour, every hour
const createPeriodicEventJob = period =>
    window['browser'].alarms.create(period, {
        // fire the initial alarm in a random minute,
        // this will ensure all of the created alarms fire at different time of the hour
        delayInMinutes: Math.floor(Math.random() * 60),
        periodInMinutes: SCHEDULES.EVERY_HOUR,
    })

window['browser'].alarms.onAlarm.addListener(alarm =>
    attemptPeriodicPing(alarm.name, getActivePeriodVars(alarm.name)),
)

// createPeriodicEventJob('month')
// createPeriodicEventJob('week')
createPeriodicEventJob('day')
