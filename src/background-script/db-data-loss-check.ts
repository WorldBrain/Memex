import type Dexie from 'dexie'
import type { captureException } from 'src/util/raven'

/*
 * This exists as we had a suspicion that sometimes browsers would forcefully evict all extension data.
 * To in/validate that we put this flag and periodically check it to see if it's still there. In
 * the case of a full data eviction, it should be gone.
 *
 * socialTags collection chosen as it's long abandoned but still exists in the DB schema. Thus less work.
 */

export const DB_DATA_LOSS_CHECK_ALARM_NAME = 'db-data-loss-check'
export const DB_DATA_LOSS_FLAG = { name: 'STORAGE_CHECK_FLAG', postId: -1 }

interface Params {
    db: Dexie
    captureException: typeof captureException
}

async function isDataLoss({ db }: Params): Promise<boolean> {
    let [existing] = await db
        .table('socialTags')
        .where({ postId: DB_DATA_LOSS_FLAG.postId })
        .primaryKeys()
    return !existing
}

export async function checkDataLoss(params: Params) {
    if (await isDataLoss(params)) {
        await params.captureException(
            new Error('OwnError: Data loss flag was not found in DB'),
        )
    }
}

export async function ensureDataLossFlagSet(params: Params) {
    if (await isDataLoss(params)) {
        await params.db.table('socialTags').add(DB_DATA_LOSS_FLAG)
    }
}
