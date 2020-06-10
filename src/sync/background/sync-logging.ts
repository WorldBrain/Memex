import cloneDeep from 'lodash/cloneDeep'
import { SyncChangeInfoPreprocessor } from '@worldbrain/storex-sync/lib/logging-middleware'
import { isTermsField } from '@worldbrain/memex-common/lib/storage/utils'

export const filterSyncLog: SyncChangeInfoPreprocessor = async (changeInfo) => {
    const removeTermFields = (object: any, collection: string) => {
        for (const field of Object.keys(object)) {
            if (isTermsField({ collection, field })) {
                delete object[field]
            }
        }
    }

    changeInfo = cloneDeep(changeInfo)
    const newChangeInfo: typeof changeInfo = { changes: [] }
    for (const change of changeInfo.changes) {
        if (change.type === 'create') {
            if (change.collection === 'pages') {
                delete change.values.screenshot
                delete change.values.text
                removeTermFields(change.values, change.collection)
            }
        } else if (change.type === 'modify') {
            if (change.collection === 'pages') {
                delete change.updates.screenshot
                delete change.updates.text
                removeTermFields(change.updates, change.collection)
                if (!Object.keys(change.updates).length) {
                    continue
                }
            }
        }
        newChangeInfo.changes.push(change)
    }
    return newChangeInfo
}
