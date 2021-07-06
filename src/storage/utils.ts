import StorageManager, {
    StorageRegistry,
    IndexSourceField,
} from '@worldbrain/storex'
import { DexieUtilsPlugin } from 'src/search/plugins'
import { getObjectPk } from '@worldbrain/storex/lib/utils'

export const dangerousPleaseBeSureDeleteAndRecreateDatabase = async (
    storageManager: StorageManager,
) => {
    return storageManager.operation(DexieUtilsPlugin.NUKE_DB_OP)
}

export function getObjectWhereByPk(
    storageRegistry: StorageRegistry,
    collection: string,
    pk: number | string | Array<number | string>,
) {
    const getPkField = (indexSourceField: IndexSourceField) => {
        return typeof indexSourceField === 'object' &&
            'relationship' in indexSourceField
            ? indexSourceField.relationship
            : indexSourceField
    }

    const collectionDefinition = storageRegistry.collections[collection]
    const pkIndex = collectionDefinition.pkIndex!
    const where: { [field: string]: number | string } = {}
    if (pkIndex instanceof Array) {
        for (const [index, indexSourceField] of pkIndex.entries()) {
            const pkField = getPkField(indexSourceField)
            where[pkField] = pk[index]
        }
    } else {
        where[getPkField(pkIndex)] = pk as number | string
    }

    return where
}

export async function getObjectByPk(
    storageManager: StorageManager,
    collection: string,
    pk: number | string | Array<number | string>,
) {
    const where = getObjectWhereByPk(storageManager.registry, collection, pk)
    return storageManager.operation('findObject', collection, where)
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
