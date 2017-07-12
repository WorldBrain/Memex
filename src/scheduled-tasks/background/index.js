import { CronJob } from 'cron'
import cleanupFreezeDry from './freeze-dry-cleanup'
import { makeDelayedTask } from '../'

// Schedule freeze-dry cleanups every 30 mins, after being idle for 30 secs
export const freezeDryCleanupTask = new CronJob({
    cronTime: '* */30 * * * *',
    onTick: makeDelayedTask(cleanupFreezeDry(), 30),
    start: true,
})
