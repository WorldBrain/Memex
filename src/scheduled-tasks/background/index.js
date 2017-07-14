import map from 'lodash/fp/map'

import db from 'src/pouchdb'
import { CronJob } from 'cron'
import cleanupFreezeDry from './freeze-dry-cleanup'
import { makeDelayedTask } from '../'

export const INDEXES = {
    FREEZE_DRY: {
        name: 'freeze-dry-cleanup-index',
        fields: ['_id', 'keepFreezeDry', 'isStub', 'isBookmarkPage'],
    },
}

// Ensure find indexes exist for any needed scheduled task queries
map(index => db.createIndex({ index }))(INDEXES)

// Schedule freeze-dry cleanups every 30 mins, after being idle for 30 secs
export const freezeDryCleanupTask = new CronJob({
    cronTime: '* */30 * * * *',
    onTick: makeDelayedTask(cleanupFreezeDry(), 30),
    start: true,
})
