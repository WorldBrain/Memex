import StorageManager from '@worldbrain/storex'
import { getObjectWhereByPk } from '@worldbrain/storex/lib/utils'
import { DexieUtilsPlugin } from 'src/search/plugins'
import { getObjectPk } from '@worldbrain/storex/lib/utils'

export const dangerousPleaseBeSureDeleteAndRecreateDatabase = async (
    storageManager: StorageManager,
) => {
    return storageManager.operation(DexieUtilsPlugin.NUKE_DB_OP)
}

export async function updateOrCreate(params: {
    storageManager: StorageManager
    executeOperation?: (
        operationName: string,
        ...operationArgs: any[]
    ) => Promise<any>
    collection: string
    where?: { [key: string]: any }
    updates: { [key: string]: any }
}) {
    const executeOperation =
        params.executeOperation ??
        ((...args) => params.storageManager.operation(...args))
    const existingObject =
        params.where &&
        (await params.executeOperation(
            'findObject',
            params.collection,
            params.where,
        ))
    if (existingObject) {
        const pk = getObjectPk(
            existingObject,
            params.collection,
            params.storageManager.registry,
        )
        const where = getObjectWhereByPk(
            params.storageManager.registry,
            params.collection,
            pk,
        )
        await executeOperation('updateObject', params.collection, where, {
            ...params.where,
            ...params.updates,
        })
    } else {
        await executeOperation('createObject', params.collection, {
            ...(params.where ?? {}),
            ...params.updates,
        })
    }
}
